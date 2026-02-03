import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type {
  ApiResponse,
  ApiError,
  SearchRequest,
  SearchProgress,
  SearchResponse,
  SearchStatus,
  FrameSearchRequest,
  SSEEvent,
  Product,
} from "@spotthisfit/shared";
import { validateVideoUrl, STATUS_MESSAGES } from "@spotthisfit/shared";
import { buildMockResults } from "../mock-data/search-results.js";
import { MOCK_PRODUCTS } from "../mock-data/products.js";
import { analyzeFrame } from "../services/vision.js";
import { getProductProvider } from "../services/product-enrichment.js";
import type {
  CjGraphQlResponse,
  CjProduct,
  CjProductsResult,
} from "../services/providers/types.js";

interface SearchSession {
  request: SearchRequest;
  pollCount: number;
  createdAt: string;
}

const searchSessions = new Map<string, SearchSession>();

const STATUS_PROGRESSION: { status: SearchStatus; progress: number }[] = [
  { status: "validating", progress: 10 },
  { status: "analyzing_frames", progress: 35 },
  { status: "identifying_products", progress: 65 },
  { status: "finding_prices", progress: 90 },
  { status: "complete", progress: 100 },
];

const CJ_PRODUCTS_QUERY_WITH_SORT = `
  query Products(
    $companyId: ID!
    $keywords: [String!]
    $limit: Int
    $offset: Int
    $partnerStatus: PartnerStatus
    $availability: Availability
    $sortBy: SortBy
    $sortOrder: SortOrder
    $advertiserCountries: [String!]
    $currency: String
  ) {
    products(
      companyId: $companyId
      keywords: $keywords
      limit: $limit
      offset: $offset
      partnerStatus: $partnerStatus
      availability: $availability
      sortBy: $sortBy
      sortOrder: $sortOrder
      advertiserCountries: $advertiserCountries
      currency: $currency
    ) {
      resultList {
        id
        title
        description
        brand
        imageLink
        additionalImageLink
        link
        mobileLink
        linkCode(pid: $companyId) {
          clickUrl
        }
        advertiserName
        advertiserId
        advertiserCountry
        price {
          amount
          currency
        }
        salePrice {
          amount
          currency
        }
      }
      totalCount
      limit
      count
      nextPage
    }
  }
`;

const CJ_PRODUCTS_QUERY_NO_SORT = `
  query Products(
    $companyId: ID!
    $keywords: [String!]
    $limit: Int
    $offset: Int
    $partnerStatus: PartnerStatus
    $availability: Availability
    $advertiserCountries: [String!]
    $currency: String
  ) {
    products(
      companyId: $companyId
      keywords: $keywords
      limit: $limit
      offset: $offset
      partnerStatus: $partnerStatus
      availability: $availability
      advertiserCountries: $advertiserCountries
      currency: $currency
    ) {
      resultList {
        id
        title
        description
        brand
        imageLink
        additionalImageLink
        link
        mobileLink
        linkCode(pid: $companyId) {
          clickUrl
        }
        advertiserName
        advertiserId
        advertiserCountry
        price {
          amount
          currency
        }
        salePrice {
          amount
          currency
        }
      }
      totalCount
      limit
      count
      nextPage
    }
  }
`;

function getQueryString(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseNumber(
  value: string | string[] | undefined
): number | undefined {
  const raw = getQueryString(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(
  value: string | string[] | undefined
): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const items = value.map((item) => item.trim()).filter(Boolean);
    return items.length ? items : undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!trimmed.includes(",")) return [trimmed];
  const items = trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function parseEnum(
  value: string | string[] | undefined,
  allowed: string[]
): string | undefined {
  const raw = getQueryString(value);
  if (!raw) return undefined;
  const normalized = raw.toUpperCase();
  return allowed.includes(normalized) ? normalized : undefined;
}

export async function searchCjProducts(req: Request, res: Response) {
  const token = process.env.CJ_AUTH_TOKEN ?? "";
  const companyId =
    getQueryString(req.query.companyId) ?? process.env.CJ_COMPANY_ID ?? "";
  const keywords =
    parseList(req.query.keywords) ??
    parseList(req.query.query) ??
    parseList(req.query.q);

  if (!companyId || !token) {
    const error: ApiError = {
      success: false,
      error: {
        code: "CONFIG_MISSING",
        message: "CJ_AUTH_TOKEN and CJ_COMPANY_ID are required",
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  if (!keywords || keywords.length === 0) {
    const error: ApiError = {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Provide a query via ?q= or ?keywords=",
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  const envSortBy = parseEnum(process.env.CJ_SORT_BY, [
    "PRICE",
    "LAST_UPDATED",
  ]);
  const envSortOrder = parseEnum(process.env.CJ_SORT_ORDER, ["ASC", "DESC"]);
  const sortBy =
    parseEnum(req.query.sortBy, ["PRICE", "LAST_UPDATED"]) ?? envSortBy;
  const sortOrder =
    parseEnum(req.query.sortOrder, ["ASC", "DESC"]) ?? envSortOrder;
  const useSorting = Boolean(sortBy && sortOrder);

  const variables: {
    companyId: string;
    keywords: string[];
    limit?: number;
    offset?: number;
    partnerStatus: string;
    availability: string;
    advertiserCountries?: string[];
    currency?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {
    companyId,
    keywords,
    limit:
      parseNumber(req.query.limit) ??
      Number(process.env.CJ_PRODUCT_LIMIT ?? 5),
    offset: parseNumber(req.query.offset),
    partnerStatus:
      parseEnum(req.query.partnerStatus, ["JOINED", "NOT_JOINED"]) ??
      (process.env.CJ_PARTNER_STATUS ?? "JOINED"),
    availability:
      parseEnum(req.query.availability, [
        "IN_STOCK",
        "OUT_OF_STOCK",
        "PREORDER",
        "BACKORDER",
      ]) ?? (process.env.CJ_AVAILABILITY ?? "IN_STOCK"),
    advertiserCountries:
      parseList(req.query.advertiserCountries) ??
      parseList(req.query.countries) ??
      (process.env.CJ_ADVERTISER_COUNTRIES
        ? process.env.CJ_ADVERTISER_COUNTRIES.split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined),
    currency: getQueryString(req.query.currency) ?? process.env.CJ_CURRENCY,
  };
  if (useSorting) {
    variables.sortBy = sortBy;
    variables.sortOrder = sortOrder;
  }

  const authHeader = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  try {
    const response = await fetch(
      process.env.CJ_API_URL ?? "https://ads.api.cj.com/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          query: useSorting
            ? CJ_PRODUCTS_QUERY_WITH_SORT
            : CJ_PRODUCTS_QUERY_NO_SORT,
          variables,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const error: ApiError = {
        success: false,
        error: {
          code: "CJ_API_ERROR",
          message: `CJ API error ${response.status}`,
          details: { response: text.slice(0, 200) },
        },
        timestamp: new Date().toISOString(),
      };
      res.status(502).json(error);
      return;
    }

    const json = (await response.json()) as CjGraphQlResponse<{
      products: CjProductsResult;
    }>;

    if (json.errors?.length) {
      const error: ApiError = {
        success: false,
        error: {
          code: "CJ_API_ERROR",
          message: json.errors.map((err) => err.message).join("; "),
        },
        timestamp: new Date().toISOString(),
      };
      res.status(502).json(error);
      return;
    }

    const result = json.data?.products;
    if (!result) {
      const error: ApiError = {
        success: false,
        error: {
          code: "CJ_API_EMPTY",
          message: "CJ API returned no data",
        },
        timestamp: new Date().toISOString(),
      };
      res.status(502).json(error);
      return;
    }

    const data: {
      products: CjProduct[];
      totalCount: number;
      count: number;
      limit: number;
      nextPage?: string | null;
    } = {
      products: result.resultList,
      totalCount: result.totalCount,
      count: result.count,
      limit: result.limit,
      nextPage: result.nextPage ?? undefined,
    };

    const payload: ApiResponse<typeof data> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };

    res.json(payload);
  } catch (err) {
    const error: ApiError = {
      success: false,
      error: {
        code: "CJ_API_ERROR",
        message: "Failed to reach CJ API",
        details: { error: String(err) },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(502).json(error);
  }
}

export async function createSearch(req: Request, res: Response) {
  const body = req.body as SearchRequest;

  if (!body.videoUrl || !body.timeRanges?.length) {
    const error: ApiError = {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Video URL and at least one time range are required",
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  // Simulate delay
  await new Promise((r) => setTimeout(r, 200));

  const searchId = uuidv4();
  searchSessions.set(searchId, {
    request: body,
    pollCount: 0,
    createdAt: new Date().toISOString(),
  });

  const response: ApiResponse<{ searchId: string }> = {
    success: true,
    data: { searchId },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

export async function getSearchStatus(req: Request, res: Response) {
  const searchId = req.params.searchId as string;
  const session = searchSessions.get(searchId);

  if (!session) {
    const error: ApiError = {
      success: false,
      error: { code: "NOT_FOUND", message: "Search session not found" },
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(error);
    return;
  }

  // Simulate delay
  await new Promise((r) => setTimeout(r, 100));

  // Advance status on each poll
  const stepIndex = Math.min(session.pollCount, STATUS_PROGRESSION.length - 1);
  const step = STATUS_PROGRESSION[stepIndex];
  session.pollCount++;

  const data: SearchProgress = {
    searchId,
    status: step.status,
    progress: step.progress,
    message: STATUS_MESSAGES[step.status],
  };

  const response: ApiResponse<SearchProgress> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

export async function getSearchResults(req: Request, res: Response) {
  const searchId = req.params.searchId as string;
  const session = searchSessions.get(searchId);

  if (!session) {
    const error: ApiError = {
      success: false,
      error: { code: "NOT_FOUND", message: "Search session not found" },
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(error);
    return;
  }

  // Simulate delay
  await new Promise((r) => setTimeout(r, 500));

  const videoUrl = validateVideoUrl(session.request.videoUrl);
  const results = buildMockResults(session.request.timeRanges.length);

  const data: SearchResponse = {
    searchId,
    videoUrl,
    results,
    processedAt: new Date().toISOString(),
    timeRangesAnalyzed: session.request.timeRanges.length,
  };

  const response: ApiResponse<SearchResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

// --- Frame-based search (new wizard flow) ---

interface FrameSearchSession {
  request: FrameSearchRequest;
  createdAt: string;
}

const frameSearchSessions = new Map<string, FrameSearchSession>();


export async function createFrameSearch(req: Request, res: Response) {
  const body = req.body as FrameSearchRequest;

  if (!body.frameImage && !body.videoUrl) {
    const error: ApiError = {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Frame image or video URL is required",
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(error);
    return;
  }

  const searchId = uuidv4();
  frameSearchSessions.set(searchId, {
    request: body,
    createdAt: new Date().toISOString(),
  });

  const response: ApiResponse<{ searchId: string }> = {
    success: true,
    data: { searchId },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
}

export async function streamSearchResults(req: Request, res: Response) {
  const searchId = req.params.searchId as string;
  const session = frameSearchSessions.get(searchId);

  if (!session) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Search session not found" },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write(": connected\n\n");

  const hasApiKey =
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your-api-key-here";

  const hasFrameImage = !!session.request.frameImage;

  let identifiedProducts: Product[];

  if (hasApiKey && hasFrameImage) {
    // Step 1: AI analysis
    const aiStatus: SSEEvent = {
      type: "status",
      data: {
        code: "analyzing_image",
        message: "Analyzing image with AI...",
        retailersSearched: 0,
      },
    };
    res.write(`event: status\ndata: ${JSON.stringify(aiStatus)}\n\n`);

    try {
      identifiedProducts = await analyzeFrame(
        session.request.frameImage,
        session.request.highlight ?? undefined,
        session.request.description ?? undefined
      );
      console.log(
        `[AI] Detected ${identifiedProducts.length} products for search ${searchId}`
      );

      const identifiedStatus: SSEEvent = {
      type: "status",
      data: {
        code: "identified_products",
        params: { count: identifiedProducts.length },
        message: `Identified ${identifiedProducts.length} products — searching retailers...`,
        retailersSearched: 0,
      },
    };
      res.write(
        `event: status\ndata: ${JSON.stringify(identifiedStatus)}\n\n`
      );
    } catch (err) {
      console.error("[AI] Vision analysis failed:", err);
      identifiedProducts = MOCK_PRODUCTS.slice(0, 8);

      const errorStatus: SSEEvent = {
      type: "status",
      data: {
        code: "ai_failed",
        message: "AI analysis failed, showing sample results...",
        retailersSearched: 0,
      },
    };
      res.write(
        `event: status\ndata: ${JSON.stringify(errorStatus)}\n\n`
      );
    }
  } else {
    // No API key — use mock products with searchQuery fields
    identifiedProducts = MOCK_PRODUCTS.slice(0, 8);
  }

  // Step 2: Enrich products via provider and stream
  const provider = getProductProvider();
  let productCount = 0;

  for await (const enrichedProduct of provider.enrichProducts(identifiedProducts)) {
    productCount++;
    const productLabel = `${enrichedProduct.brand !== "Unknown" ? enrichedProduct.brand + " " : ""}${enrichedProduct.name}`;

    // Status update
    const searchStatus: SSEEvent = {
      type: "status",
      data: {
        code: "found_product",
        params: { product: productLabel },
        message: `Found ${productLabel}`,
        retailersSearched: productCount,
      },
    };
    res.write(`event: status\ndata: ${JSON.stringify(searchStatus)}\n\n`);

    // Small delay for first product (provider may already add its own latency)
    if (productCount === 1) {
      await new Promise((r) => setTimeout(r, 200));
    }

    // Stream the product
    const productEvent: SSEEvent = {
      type: "product",
      data: enrichedProduct,
    };
    res.write(`event: product\ndata: ${JSON.stringify(productEvent)}\n\n`);

    console.log(
      `[Stream] Product ${productCount}/${identifiedProducts.length}: ${enrichedProduct.name} → ${enrichedProduct.affiliateUrl ?? enrichedProduct.shopUrl}`
    );
  }

  await new Promise((r) => setTimeout(r, 500));

  const completeEvent: SSEEvent = {
    type: "complete",
    data: { totalProducts: productCount },
  };
  res.write(`event: complete\ndata: ${JSON.stringify(completeEvent)}\n\n`);

  res.end();
}
