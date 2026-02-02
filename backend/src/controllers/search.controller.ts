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
