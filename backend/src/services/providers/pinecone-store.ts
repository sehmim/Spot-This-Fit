import { Pinecone } from "@pinecone-database/pinecone";
import type { Product, ProductCategory } from "@spotthisfit/shared";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY ?? "";
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "shoes-clip";

let pineconeIndex: ReturnType<Pinecone["Index"]> | null = null;

function getIndex() {
  if (!pineconeIndex) {
    if (!PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not set");
    }
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pc.Index(PINECONE_INDEX_NAME);
  }
  return pineconeIndex;
}

export function pineconeEnabled(): boolean {
  return Boolean(PINECONE_API_KEY);
}

function inferCategory(title: string): ProductCategory {
  const t = title.toLowerCase();
  if (/\b(shoe|sneaker|boot|loafer|sandal|trainer|heel|flat|slipper|mule|clog)\b/.test(t)) return "shoes";
  if (/\b(jacket|coat|overcoat|blazer|parka|hoodie|vest|gilet|windbreaker)\b/.test(t)) return "outerwear";
  if (/\b(pants?|trousers?|jeans|shorts|chinos?|joggers?|leggings|skirt)\b/.test(t)) return "bottom";
  if (/\b(shirt|blouse|top|polo|tee|t-shirt|sweatshirt|sweater|jumper|pullover|cardigan)\b/.test(t)) return "top";
  if (/\b(dress|gown|romper|jumpsuit)\b/.test(t)) return "dress";
  if (/\b(bag|handbag|backpack|purse|tote)\b/.test(t)) return "bag";
  return "other";
}

function parsePrice(priceStr: string): { amount: number; currency: string } {
  if (!priceStr) return { amount: 0, currency: "USD" };
  const match = priceStr.match(/([\d.]+)\s*([A-Z]{3})?/);
  if (!match) return { amount: 0, currency: "USD" };
  return {
    amount: parseFloat(match[1]) || 0,
    currency: match[2] || "USD",
  };
}

export async function searchPineconeByImage(
  embedding: number[],
  limit: number = 20
): Promise<Product[]> {
  const index = getIndex();

  const results = await index.query({
    vector: embedding,
    topK: limit,
    includeMetadata: true,
  });

  return (results.matches ?? []).map((match, i) => {
    const meta = match.metadata ?? {};
    const title = String(meta.title ?? "Unknown Product");
    const { amount, currency } = parsePrice(String(meta.price ?? ""));
    const saleParsed = parsePrice(String(meta.sale_price ?? ""));
    const score = match.score ?? 0;

    return {
      id: match.id,
      name: title,
      brand: "Unknown",
      category: inferCategory(title),
      imageUrl: String(meta.image_link ?? ""),
      price: saleParsed.amount > 0 ? saleParsed.amount : amount,
      currency,
      originalPrice: saleParsed.amount > 0 ? amount : undefined,
      shopUrl: String(meta.link ?? ""),
      affiliateUrl: String(meta.link ?? ""),
      retailer: "Awin",
      confidence: score > 0.75 ? "high" : score > 0.6 ? "medium" : "low",
      confidenceScore: Math.round(score * 100),
      availability: String(meta.availability ?? ""),
      onSale: saleParsed.amount > 0 && saleParsed.amount < amount,
      color: String(meta.gender ?? ""),
    };
  });
}
