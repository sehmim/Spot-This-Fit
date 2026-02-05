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
  // Tops
  top: "top",
  shirt: "top",
  tshirt: "top",
  "t-shirt": "top",
  sweater: "top",
  hoodie: "top",
  blouse: "top",
  tank: "top",
  "tank top": "top",
  polo: "top",
  cardigan: "top",
  "crop top": "top",
  tunic: "top",
  camisole: "top",
  bodysuit: "top",

  // Bottoms
  bottom: "bottom",
  pants: "bottom",
  jeans: "bottom",
  trousers: "bottom",
  shorts: "bottom",
  skirt: "bottom",
  chinos: "bottom",
  leggings: "bottom",
  joggers: "bottom",
  "cargo pants": "bottom",
  culottes: "bottom",

  // Dresses & Jumpsuits
  dress: "dress",
  "mini dress": "dress",
  "midi dress": "dress",
  "maxi dress": "dress",
  jumpsuit: "dress",
  romper: "dress",
  playsuit: "dress",

  // Outerwear
  outerwear: "outerwear",
  jacket: "outerwear",
  coat: "outerwear",
  blazer: "outerwear",
  vest: "outerwear",
  parka: "outerwear",
  windbreaker: "outerwear",
  bomber: "outerwear",
  "denim jacket": "outerwear",
  "leather jacket": "outerwear",
  trench: "outerwear",
  puffer: "outerwear",
  fleece: "outerwear",

  // Shoes
  shoes: "shoes",
  sneakers: "shoes",
  boots: "shoes",
  "ankle boots": "shoes",
  loafers: "shoes",
  sandals: "shoes",
  heels: "shoes",
  flats: "shoes",
  oxfords: "shoes",
  mules: "shoes",
  slides: "shoes",
  "running shoes": "shoes",
  "high tops": "shoes",
  espadrilles: "shoes",

  // Accessories
  accessory: "accessory",
  hat: "accessory",
  cap: "accessory",
  beanie: "accessory",
  sunglasses: "accessory",
  glasses: "accessory",
  watch: "accessory",
  belt: "accessory",
  scarf: "accessory",
  tie: "accessory",
  gloves: "accessory",
  wallet: "accessory",
  "phone case": "accessory",
  headband: "accessory",
  "hair clip": "accessory",
  socks: "accessory",

  // Bags
  bag: "bag",
  backpack: "bag",
  purse: "bag",
  crossbody: "bag",
  tote: "bag",
  clutch: "bag",
  "shoulder bag": "bag",
  "messenger bag": "bag",
  "fanny pack": "bag",
  duffel: "bag",

  // Jewelry
  jewelry: "jewelry",
  necklace: "jewelry",
  bracelet: "jewelry",
  earrings: "jewelry",
  ring: "jewelry",
  anklet: "jewelry",
  brooch: "jewelry",
  cufflinks: "jewelry",
  pendant: "jewelry",

  // Swimwear
  swimwear: "other",
  bikini: "other",
  "one-piece": "other",
  "swim trunks": "other",

  // Activewear
  "sports bra": "top",
  "yoga pants": "bottom",
  "athletic shorts": "bottom",
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
  highlight?: HighlightRegion,
  description?: string
): Promise<Product[]> {
  const hasHighlight = highlight && description;

  const contextBlock = hasHighlight
    ? `The user has drawn a bounding box at approximately: x=${Math.round(highlight.x * 100)}% from left, y=${Math.round(highlight.y * 100)}% from top, width=${Math.round(highlight.width * 100)}%, height=${Math.round(highlight.height * 100)}%. The user describes the highlighted product as: "${description}"`
    : `The user uploaded this image directly. There is NO highlighted region — identify ALL fashion products visible in the entire image.`;

  const highlightInstructions = hasHighlight
    ? `- The highlighted product should be listed FIRST with isHighlighted: true
- For all OTHER items, set isHighlighted: false`
    : `- Set isHighlighted: false for all items (no specific product was highlighted)`;

  const prompt = `You are an expert fashion product identifier. Your task is to identify EVERY fashion item visible in this image with maximum detail for product search matching.

${contextBlock}

## YOUR TASK
Scan the ENTIRE image and identify ALL fashion items including:
- Clothing: tops, shirts, t-shirts, sweaters, hoodies, jackets, coats, blazers, dresses, pants, jeans, shorts, skirts, jumpsuits
- Footwear: sneakers, boots, heels, sandals, loafers, flats, slides
- Bags: backpacks, totes, crossbody bags, clutches, purses, shoulder bags
- Accessories: hats, caps, beanies, sunglasses, watches, belts, scarves, ties, gloves
- Jewelry: necklaces, bracelets, earrings, rings, anklets
- Even partially visible items (sleeves, hems, straps showing)

## OUTPUT FORMAT
For EACH item, provide:

1. **name**: Descriptive product name in retail format: "[Brand] [Gender] [Color] [Product Type] [Key Detail]"
   Examples: "Nike Womens White Air Force 1 Low Sneakers", "Zara Black Leather Crossbody Bag", "Levi's Mens Blue 501 Original Jeans"

2. **exactModel**: Specific model/SKU if identifiable (e.g., "CW2288-111"). null if unknown.

3. **brand**: Brand name. Look for:
   - Visible logos, swooshes, stripes, monograms
   - Distinctive silhouettes (Adidas Superstar shell toe, Converse Chuck Taylor toe cap)
   - Signature design elements (Burberry check, Louis Vuitton monogram)
   - null ONLY if truly unidentifiable

4. **category**: One of: top, shirt, tshirt, sweater, hoodie, cardigan, pants, jeans, shorts, skirt, leggings, dress, jumpsuit, jacket, coat, blazer, vest, parka, sneakers, boots, heels, sandals, loafers, flats, hat, cap, sunglasses, watch, belt, scarf, bag, backpack, crossbody, tote, clutch, necklace, bracelet, earrings, ring, accessory, other

5. **color**: Primary color(s). Be specific:
   - Use exact colorway names if known: "Triple White", "Bred", "University Blue"
   - Otherwise describe: "Navy Blue", "Cream/Off-White", "Black with White Accents"

6. **material**: Primary material: "leather", "suede", "denim", "cotton", "polyester", "canvas", "nylon", "wool", "silk", "linen", "synthetic", etc.

7. **description**: Key identifying features for search matching:
   - Fit: slim, regular, oversized, cropped
   - Style: casual, formal, sporty, streetwear
   - Details: logo placement, pattern, hardware color, closure type
   Format: "Brand: [X], Type: [Y], Color: [Z], Style: [W]" when possible

8. **confidence**: 0-100 (how confident in exact identification, not just category)

9. **isHighlighted**: true only for user-highlighted item, false otherwise

10. **searchQuery**: CRITICAL - Optimized search query for finding this product. Format:
    "[Brand] [Color] [Product Type] [Gender if apparent] [Key distinguishing words]"
    Examples:
    - "Nike Air Force 1 White Low Mens Sneakers"
    - "Black Leather Crossbody Bag Gold Hardware"
    - "Adidas Originals Samba White Gum Women"
    - "Blue Denim Jacket Oversized Vintage Wash"

## IDENTIFICATION TIPS
- **Sneakers**: Sole shape, toe box style, midsole profile, heel tab, lacing, logos/swoosh/stripes placement
- **Bags**: Hardware color (gold/silver), strap style, closure type, logo placement, shape
- **Jackets**: Collar type, zipper style, pocket design, length, brand tags
- **Jeans**: Wash (light/medium/dark), distressing, rise (high/mid/low), leg shape, pocket stitching
- **Dresses**: Silhouette (bodycon/shift/A-line), length (mini/midi/maxi), neckline, sleeve type
- **Watches**: Case shape, band material, dial color, brand markers
- **Sunglasses**: Frame shape (aviator/wayfarer/round/cat-eye), temple design, logo placement

## RULES
${highlightInstructions}
- List EVERY visible fashion item - do not skip anything
- Include items even if only partially visible
- Be SPECIFIC: "Adidas Stan Smith White Green" not "white sneakers"
- For unknown brands, still describe fully: "White Canvas Low Top Sneakers with Gum Sole"
- Gender: Include "Mens", "Womens", or "Unisex" in searchQuery when apparent

Respond with ONLY a valid JSON array, no markdown, no explanation:
[{"name":"...","exactModel":null,"brand":"...","category":"...","color":"...","material":"...","description":"...","confidence":85,"isHighlighted":false,"searchQuery":"..."}, ...]`;

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

  // Convert to Product type (without listing data — that's added later in the pipeline)
  // imageUrl is empty placeholder - will be replaced by provider with actual product image
  return detected.map((item) => ({
    id: uuidv4(),
    name: item.name,
    brand: item.brand ?? "Unknown",
    category: mapCategory(item.category),
    imageUrl: "", // Placeholder - replaced by Awin product image
    price: 0,
    currency: "USD",
    shopUrl: "#",
    retailer: "Searching retailers...",
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
