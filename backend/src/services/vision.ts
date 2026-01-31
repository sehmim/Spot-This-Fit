import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type { Product, ProductCategory, ConfidenceLevel } from "@spotthisfit/shared";
import type { HighlightRegion } from "@spotthisfit/shared";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectedProduct {
  name: string;
  exactModel: string | null;
  brand: string | null;
  category: string;
  color: string;
  material: string | null;
  description: string;
  confidence: number;
  isHighlighted: boolean;
  searchQuery: string;
}

const CATEGORY_MAP: Record<string, ProductCategory> = {
  top: "top",
  shirt: "top",
  tshirt: "top",
  "t-shirt": "top",
  sweater: "top",
  hoodie: "top",
  blouse: "top",
  tank: "top",
  polo: "top",
  bottom: "bottom",
  pants: "bottom",
  jeans: "bottom",
  trousers: "bottom",
  shorts: "bottom",
  skirt: "bottom",
  chinos: "bottom",
  dress: "dress",
  outerwear: "outerwear",
  jacket: "outerwear",
  coat: "outerwear",
  blazer: "outerwear",
  vest: "outerwear",
  shoes: "shoes",
  sneakers: "shoes",
  boots: "shoes",
  loafers: "shoes",
  sandals: "shoes",
  heels: "shoes",
  accessory: "accessory",
  hat: "accessory",
  cap: "accessory",
  sunglasses: "accessory",
  watch: "accessory",
  belt: "accessory",
  scarf: "accessory",
  bag: "bag",
  backpack: "bag",
  purse: "bag",
  crossbody: "bag",
  tote: "bag",
  jewelry: "jewelry",
  necklace: "jewelry",
  bracelet: "jewelry",
  earrings: "jewelry",
  ring: "jewelry",
};

function mapCategory(raw: string): ProductCategory {
  const lower = raw.toLowerCase().trim();
  return CATEGORY_MAP[lower] ?? "other";
}

function mapConfidence(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export async function analyzeFrame(
  frameImageBase64: string,
  highlight: HighlightRegion,
  description: string
): Promise<Product[]> {
  const highlightDescription = `The user has drawn a bounding box at approximately: x=${Math.round(highlight.x * 100)}% from left, y=${Math.round(highlight.y * 100)}% from top, width=${Math.round(highlight.width * 100)}%, height=${Math.round(highlight.height * 100)}%. The user describes the highlighted product as: "${description}"`;

  const prompt = `You are an expert fashion product identifier with deep knowledge of brands, product lines, model numbers, colorways, and seasonal collections. Your job is to identify EXACT products — not general descriptions.

${highlightDescription}

Analyze this image and identify ALL fashion products/clothing items visible. For EACH item, you must:

1. **name**: The EXACT product name if recognizable (e.g. "Nike Air Force 1 '07 Low", "Levi's 501 Original Fit", "The North Face Nuptse 1996"). If you can't identify the exact product, use a detailed descriptive name.
2. **exactModel**: The specific model/variant/SKU identifier if recognizable (e.g. "CW2288-111", "501-0115", "NF0A3C8D"). Set to null if unknown.
3. **brand**: The brand name. Look for logos, distinctive design elements, stitching patterns, label placements, and silhouette signatures. Set to null only if truly unidentifiable.
4. **category**: One of: top, shirt, tshirt, sweater, hoodie, pants, jeans, shorts, skirt, dress, jacket, coat, blazer, shoes, sneakers, boots, loafers, hat, cap, sunglasses, bag, crossbody, belt, watch, necklace, bracelet, earrings, ring, accessory, other
5. **color**: Exact colorway name if known (e.g. "Triple White", "Obsidian/University Blue"), otherwise descriptive colors
6. **material**: Primary material (e.g. "full-grain leather", "French terry cotton", "ripstop nylon")
7. **description**: A concise description focusing on distinguishing features, fit, and style details that would help someone find this exact product
8. **confidence**: 0-100, how confident you are in the EXACT identification (not just the category)
9. **isHighlighted**: true if this is the item the user highlighted/described
10. **searchQuery**: An optimized Amazon search query to find this EXACT product. Include brand, model name, color, and key distinguishing features. This should be specific enough to find the right product on Amazon. Example: "Nike Air Force 1 07 Low Triple White Men's" or "Levi's 501 Original Fit Medium Stonewash Men's Jeans"

IDENTIFICATION TIPS:
- For sneakers: Look at sole shape, toe box, midsole profile, heel counter, lacing system, and any visible logos/swooshes/stripes
- For bags: Look at hardware, strap style, closure type, logo placement, and distinctive shapes
- For jackets: Look at zipper style, collar type, pocket placement, and brand tags
- For hats/caps: Look at crown shape, bill curve, logo/embroidery, and construction
- For jeans: Look at wash, distressing, rise, leg shape, and back pocket stitching

IMPORTANT:
- The highlighted product should be listed FIRST with isHighlighted: true
- Include ALL visible fashion items
- Be as SPECIFIC as possible — "Nike Air Max 90 Essential White/Black" is better than "White Nike Sneakers"
- The searchQuery should be optimized for Amazon.ca product search
- If you recognize a specific collection or season (e.g. "FW24", "Spring 2024"), include it

Respond with ONLY a JSON array, no markdown, no explanation:
[{"name":"...","exactModel":"...","brand":"...","category":"...","color":"...","material":"...","description":"...","confidence":85,"isHighlighted":true,"searchQuery":"..."}, ...]`;

  // Strip the data:image/jpeg;base64, prefix if present
  const base64Data = frameImageBase64.includes(",")
    ? frameImageBase64.split(",")[1]
    : frameImageBase64;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from vision model");
  }

  // Parse the JSON response — handle potential markdown wrapping
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let detected: DetectedProduct[];
  try {
    detected = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse vision response: ${jsonStr.slice(0, 200)}`);
  }

  if (!Array.isArray(detected)) {
    throw new Error("Vision response is not an array");
  }

  // Sort: highlighted product first, then by confidence
  detected.sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;
    return b.confidence - a.confidence;
  });

  // Convert to Product type (without Amazon data — that's added later in the pipeline)
  return detected.map((item) => ({
    id: uuidv4(),
    name: item.name,
    brand: item.brand ?? "Unknown",
    category: mapCategory(item.category),
    imageUrl: `https://picsum.photos/seed/${uuidv4().slice(0, 8)}/400/500`,
    price: 0,
    currency: "CAD",
    shopUrl: "#",
    retailer: "Searching Amazon.ca...",
    confidence: mapConfidence(item.confidence),
    confidenceScore: item.confidence,
    description: `${item.color} — ${item.description}`,
    isHighlighted: item.isHighlighted,
    searchQuery: item.searchQuery,
    color: item.color,
    material: item.material ?? undefined,
    exactModel: item.exactModel ?? undefined,
  }));
}
