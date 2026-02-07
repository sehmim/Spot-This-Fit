import { createReadStream, createWriteStream } from "fs";
import { stat } from "fs/promises";
import { parse } from "csv-parse";

/**
 * Purifies raw Awin product feed CSV into a clean CSV matching the Lykdat
 * catalog import format (https://apidocs.lykdat.com/#catalog-import-files).
 *
 * Filters out:
 *  - Out of stock / sold out items
 *  - Items not marked for sale
 *  - Items with no image
 *  - Items with no price or zero price
 *  - Items with no product name
 *
 * Output columns (Lykdat spec):
 *  id, title, link, image_link, additional_image_link, availability,
 *  price, sale_price, gender, size, google_product_category
 */

// Categories that map to a gender hint
const FEMALE_KEYWORDS = [
  "women",
  "woman",
  "ladies",
  "lingerie",
  "maternity",
  "girls",
];
const MALE_KEYWORDS = ["men's", "mens", "boys"];

function inferGender(category: string, description: string): string {
  const text = `${category} ${description}`.toLowerCase();
  const isFemale = FEMALE_KEYWORDS.some((kw) => text.includes(kw));
  const isMale = MALE_KEYWORDS.some((kw) => text.includes(kw));
  if (isFemale && !isMale) return "female";
  if (isMale && !isFemale) return "male";
  return "unisex";
}

function normalizeAvailability(
  inStock: string,
  stockStatus: string
): string | null {
  const status = stockStatus.toLowerCase().trim();
  const flag = inStock.trim();

  if (
    status === "out of stock" ||
    status === "sold out" ||
    status === "discontinued"
  ) {
    return null; // exclude
  }

  if (flag === "1" || status === "in stock" || status === "in_stock") {
    return "in stock";
  }

  if (status === "available to order") {
    return "in stock";
  }

  // If in_stock flag is explicitly 0, exclude
  if (flag === "0") return null;

  // Default: if no signal at all, exclude to keep catalog clean
  return null;
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) return "";
  const cur = currency.trim().toUpperCase() || "GBP";
  return `${num.toFixed(2)} ${cur}`;
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(https?:\/\/)(.+)$/);
  if (!match) return "";
  // Encode characters that are invalid in URLs: spaces, non-breaking spaces, commas
  const cleaned = match[2]
    .replace(/ /g, "%20")
    .replace(/\xA0/g, "%20")
    .replace(/,/g, "%2C");
  return match[1] + cleaned;
}

function pickBestImage(
  merchantImage: string,
  awImage: string,
  largeImage: string
): string {
  return (
    sanitizeUrl(largeImage) || sanitizeUrl(merchantImage) || sanitizeUrl(awImage)
  );
}

function buildAdditionalImages(
  merchantImage: string,
  awImage: string,
  largeImage: string,
  altImage: string,
  altImage2: string,
  altImage3: string,
  altImage4: string,
  primaryUsed: string
): string {
  const candidates = [
    merchantImage,
    awImage,
    largeImage,
    altImage,
    altImage2,
    altImage3,
    altImage4,
  ];
  const extras = candidates
    .map((u) => sanitizeUrl(u))
    .filter((u) => u && u !== primaryUsed);
  // Deduplicate
  return [...new Set(extras)].slice(0, 3).join(",");
}

const LYKDAT_COLUMNS = [
  "id",
  "title",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "price",
  "sale_price",
  "gender",
  "size",
  "google_product_category",
] as const;

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function writeCsvRow(
  stream: ReturnType<typeof createWriteStream>,
  values: string[]
): void {
  stream.write(values.map(csvEscape).join(",") + "\n");
}

async function main() {
  const inputPath =
    process.argv[2] || "data/awin-data-02-05.csv";
  const outputPath =
    process.argv[3] || inputPath.replace(/\.csv$/, "-purified.csv");

  try {
    const fileStat = await stat(inputPath);
    console.log(
      `[purify] Input: ${inputPath} (${(fileStat.size / 1024 / 1024).toFixed(1)} MB)`
    );
  } catch {
    console.error(`[purify] File not found: ${inputPath}`);
    process.exit(1);
  }

  const parser = createReadStream(inputPath, { encoding: "utf-8" }).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    })
  );

  const output = createWriteStream(outputPath, { encoding: "utf-8" });
  writeCsvRow(output, [...LYKDAT_COLUMNS]);

  let total = 0;
  let kept = 0;
  let skipped = {
    outOfStock: 0,
    noImage: 0,
    noPrice: 0,
    noTitle: 0,
    notForSale: 0,
  };

  for await (const row of parser) {
    total++;

    // --- Filtering ---

    const title = (row.product_name || "").trim();
    if (!title) {
      skipped.noTitle++;
      continue;
    }

    const isForSale = (row.is_for_sale || "").trim();
    if (isForSale === "0") {
      skipped.notForSale++;
      continue;
    }

    const availability = normalizeAvailability(
      row.in_stock || "",
      row.stock_status || ""
    );
    if (!availability) {
      skipped.outOfStock++;
      continue;
    }

    const price = formatPrice(row.search_price || "", row.currency || "");
    if (!price) {
      skipped.noPrice++;
      continue;
    }

    const primaryImage = pickBestImage(
      row.merchant_image_url || "",
      row.aw_image_url || "",
      row.large_image || ""
    );
    if (!primaryImage) {
      skipped.noImage++;
      continue;
    }

    // --- Build output row ---

    const salePrice =
      row.product_price_old && parseFloat(row.product_price_old) > 0
        ? formatPrice(row.search_price || "", row.currency || "")
        : "";
    const originalPrice =
      row.product_price_old && parseFloat(row.product_price_old) > 0
        ? formatPrice(row.product_price_old, row.currency || "")
        : price;

    const additionalImages = buildAdditionalImages(
      row.merchant_image_url || "",
      row.aw_image_url || "",
      row.large_image || "",
      row.alternate_image || "",
      row.alternate_image_two || "",
      row.alternate_image_three || "",
      row.alternate_image_four || "",
      primaryImage
    );

    const gender = inferGender(
      row.category_name || "",
      row.description || ""
    );

    const size = (row["fashion:size"] || row.size_stock_status || "").trim();

    const googleCategory =
      (row.merchant_product_category_path || row.category_name || "").trim();

    writeCsvRow(output, [
      row.aw_product_id || row.merchant_product_id || "",
      title,
      sanitizeUrl(row.aw_deep_link || row.merchant_deep_link || ""),
      primaryImage,
      additionalImages,
      availability,
      salePrice ? originalPrice : price,
      salePrice,
      gender,
      size,
      googleCategory,
    ]);

    kept++;

    if (total % 100000 === 0) {
      console.log(`[purify] Processed ${total} rows, kept ${kept}...`);
    }
  }

  await new Promise<void>((resolve, reject) => {
    output.end(() => resolve());
    output.on("error", reject);
  });

  console.log(`\n[purify] Done!`);
  console.log(`[purify] Total rows:    ${total}`);
  console.log(`[purify] Kept:          ${kept}`);
  console.log(`[purify] Removed:       ${total - kept}`);
  console.log(`[purify]   Out of stock:  ${skipped.outOfStock}`);
  console.log(`[purify]   No image:      ${skipped.noImage}`);
  console.log(`[purify]   No price:      ${skipped.noPrice}`);
  console.log(`[purify]   No title:      ${skipped.noTitle}`);
  console.log(`[purify]   Not for sale:  ${skipped.notForSale}`);
  console.log(`[purify] Output: ${outputPath}`);
}

main().catch((err) => {
  console.error("[purify] Unhandled error:", err);
  process.exit(1);
});
