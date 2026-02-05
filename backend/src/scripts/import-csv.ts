import "dotenv/config";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { parse } from "csv-parse";
import postgres from "postgres";

// Column mapping: CSV header -> DB column name
const COLUMN_MAP: Record<string, string> = {
  aw_product_id: "aw_product_id",
  product_name: "product_name",
  brand_name: "brand_name",
  aw_image_url: "aw_image_url",
  merchant_image_url: "merchant_image_url",
  large_image: "large_image",
  search_price: "search_price",
  store_price: "store_price",
  display_price: "display_price",
  rrp_price: "rrp_price",
  savings_percent: "savings_percent",
  currency: "currency",
  aw_deep_link: "aw_deep_link",
  merchant_deep_link: "merchant_deep_link",
  merchant_name: "merchant_name",
  description: "description",
  product_short_description: "product_short_description",
  category_name: "category_name",
  merchant_category: "merchant_category",
  product_type: "product_type",
  colour: "colour",
  in_stock: "in_stock",
  stock_status: "stock_status",
  keywords: "keywords",
  "fashion:material": "fashion_material",
  "fashion:size": "fashion_size",
  product_model: "product_model",
  model_number: "model_number",
};

const DB_COLUMNS = Object.values(COLUMN_MAP);
const NUMERIC_COLUMNS = new Set([
  "search_price",
  "store_price",
  "rrp_price",
  "savings_percent",
]);
// Postgres max params = 65534, 26 columns -> max ~2500 rows per batch
const BATCH_SIZE = 2500;

// The table creation SQL (same schema as migration, but for staging table)
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS awin_products_new (
    id                          SERIAL PRIMARY KEY,
    aw_product_id               TEXT NOT NULL,
    product_name                TEXT NOT NULL DEFAULT '',
    brand_name                  TEXT DEFAULT '',
    aw_image_url                TEXT DEFAULT '',
    merchant_image_url          TEXT DEFAULT '',
    large_image                 TEXT DEFAULT '',
    search_price                NUMERIC(10,2) DEFAULT 0,
    store_price                 NUMERIC(10,2),
    display_price               TEXT DEFAULT '',
    rrp_price                   NUMERIC(10,2),
    savings_percent             NUMERIC(5,2),
    currency                    TEXT DEFAULT 'USD',
    aw_deep_link                TEXT DEFAULT '',
    merchant_deep_link          TEXT DEFAULT '',
    merchant_name               TEXT DEFAULT '',
    description                 TEXT DEFAULT '',
    product_short_description   TEXT DEFAULT '',
    category_name               TEXT DEFAULT '',
    merchant_category           TEXT DEFAULT '',
    product_type                TEXT DEFAULT '',
    colour                      TEXT DEFAULT '',
    in_stock                    TEXT DEFAULT '',
    stock_status                TEXT DEFAULT '',
    keywords                    TEXT DEFAULT '',
    fashion_material            TEXT DEFAULT '',
    fashion_size                TEXT DEFAULT '',
    product_model               TEXT DEFAULT '',
    model_number                TEXT DEFAULT '',
    search_vector               TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(brand_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(colour, '')), 'C') ||
        setweight(to_tsvector('english',
            COALESCE(description, '') || ' ' ||
            COALESCE(category_name, '') || ' ' ||
            COALESCE(keywords, '') || ' ' ||
            COALESCE(fashion_material, '')
        ), 'D')
    ) STORED,
    is_in_stock                 BOOLEAN GENERATED ALWAYS AS (
        in_stock = '1' OR stock_status = 'in stock'
    ) STORED,
    imported_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

async function main() {
  const csvPath = process.argv[2] || process.env.AWIN_LOCAL_FEED_PATH;

  if (!csvPath) {
    console.error(
      "Usage: tsx src/scripts/import-csv.ts <path-to-csv>\n" +
        "   Or set AWIN_LOCAL_FEED_PATH in .env"
    );
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[import] DATABASE_URL not set");
    process.exit(1);
  }

  // Check file exists
  try {
    const fileStat = await stat(csvPath);
    console.log(
      `[import] CSV file: ${csvPath} (${(fileStat.size / 1024 / 1024).toFixed(1)} MB)`
    );
  } catch {
    console.error(`[import] File not found: ${csvPath}`);
    process.exit(1);
  }

  const sql = postgres(url, { max: 3 });
  const startTime = Date.now();

  try {
    // 1. Drop staging table if it exists (from a previous failed run)
    console.log("[import] Preparing staging table...");
    await sql.unsafe("DROP TABLE IF EXISTS awin_products_new CASCADE");

    // 2. Create staging table
    await sql.unsafe(CREATE_TABLE_SQL);

    // 3. Stream-parse CSV and batch insert
    let totalRows = 0;
    let batch: Record<string, string | null>[] = [];
    let headerMap: Map<string, string> | null = null;

    const parser = createReadStream(csvPath, { encoding: "utf-8" }).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      })
    );

    for await (const record of parser) {
      // On first row, build the header mapping
      if (!headerMap) {
        headerMap = new Map();
        for (const csvCol of Object.keys(record)) {
          const normalized = csvCol.toLowerCase().trim();
          if (COLUMN_MAP[normalized]) {
            headerMap.set(csvCol, COLUMN_MAP[normalized]);
          }
        }
        console.log(
          `[import] Mapped ${headerMap.size}/${DB_COLUMNS.length} columns from CSV`
        );
      }

      // Extract only required columns
      const row: Record<string, string | null> = {};
      for (const [csvCol, dbCol] of headerMap) {
        const val = (record[csvCol] ?? "").trim();
        if (NUMERIC_COLUMNS.has(dbCol)) {
          // Clean numeric values
          const num = parseFloat(val);
          row[dbCol] = isNaN(num) ? null : String(num);
        } else {
          row[dbCol] = val || "";
        }
      }

      batch.push(row);
      totalRows++;

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(sql, batch);
        batch = [];
        if (totalRows % 50000 === 0) {
          console.log(`[import] Inserted ${totalRows} rows...`);
        }
      }
    }

    // Insert remaining rows
    if (batch.length > 0) {
      await insertBatch(sql, batch);
    }

    console.log(`[import] Total rows inserted: ${totalRows}`);

    // 4. Create indexes on staging table
    console.log("[import] Building indexes on staging table...");
    await sql.unsafe(
      "CREATE INDEX idx_new_search ON awin_products_new USING GIN (search_vector)"
    );
    await sql.unsafe(
      "CREATE INDEX idx_new_aw_id ON awin_products_new (aw_product_id)"
    );
    await sql.unsafe(
      "CREATE INDEX idx_new_in_stock ON awin_products_new (is_in_stock) WHERE is_in_stock = true"
    );
    await sql.unsafe(
      "CREATE INDEX idx_new_price ON awin_products_new (search_price)"
    );

    // 5. Atomic table swap
    console.log("[import] Performing atomic table swap...");
    await sql.begin(async (tx) => {
      // Check if the main table exists
      const exists = await tx.unsafe(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'awin_products' AND table_schema = 'public'"
      );

      if (exists.length > 0) {
        await tx.unsafe("ALTER TABLE awin_products RENAME TO awin_products_old");
      }
      await tx.unsafe(
        "ALTER TABLE awin_products_new RENAME TO awin_products"
      );
      if (exists.length > 0) {
        await tx.unsafe("DROP TABLE IF EXISTS awin_products_old CASCADE");
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[import] Done! ${totalRows} products imported in ${elapsed}s`);

    // Verify
    const count = await sql`SELECT COUNT(*) AS n FROM awin_products`;
    console.log(`[import] Verified: ${count[0].n} rows in awin_products`);
  } catch (err) {
    console.error("[import] Failed:", err);

    // Cleanup staging table on failure
    try {
      await sql.unsafe("DROP TABLE IF EXISTS awin_products_new CASCADE");
    } catch {
      // ignore cleanup errors
    }

    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function insertBatch(
  sql: postgres.Sql,
  batch: Record<string, string | null>[]
) {
  if (batch.length === 0) return;

  // Ensure all rows have all columns with non-undefined values
  const cleanBatch = batch.map((row) => {
    const clean: Record<string, string | null> = {};
    for (const col of DB_COLUMNS) {
      clean[col] = row[col] ?? null;
    }
    return clean;
  });

  await sql`
    INSERT INTO awin_products_new ${sql(cleanBatch, ...DB_COLUMNS)}
  `;
}

main().catch((err) => {
  console.error("[import] Unhandled error:", err);
  process.exit(1);
});
