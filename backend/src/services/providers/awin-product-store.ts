import { sql } from "../../db/connection.js";
import type { AwinProduct, AwinSearchResult } from "./types.js";

/**
 * Database-backed product store, replacing the in-memory AwinFeedCache.
 * Uses PostgreSQL full-text search with weighted tsvector + GIN index.
 */
export class AwinProductStore {
  /**
   * Search products using PostgreSQL full-text search.
   * Replicates the weighted scoring: brand > colour > name > description.
   */
  async searchProducts(
    query: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<AwinSearchResult[]> {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (words.length === 0) return [];

    // Build OR tsquery for broad matching (similar to in-memory per-word match)
    const tsQueryStr = words.join(" | ");
    const rawQuery = query;

    const rows = await sql`
      SELECT
        aw_product_id, product_name, brand_name,
        aw_image_url, merchant_image_url, large_image,
        search_price::text AS search_price,
        store_price::text AS store_price,
        display_price::text AS display_price,
        rrp_price::text AS rrp_price,
        savings_percent::text AS savings_percent,
        currency, aw_deep_link, merchant_deep_link,
        merchant_name, description, product_short_description,
        category_name, merchant_category, product_type,
        colour, in_stock, stock_status, keywords,
        fashion_material, fashion_size,
        product_model, model_number,
        is_in_stock,
        (
          CASE WHEN product_name ILIKE ${"%" + rawQuery + "%"} THEN 5 ELSE 0 END
          + ts_rank(
              '{0.1, 0.3, 0.4, 0.2}'::float4[],
              search_vector,
              to_tsquery('english', ${tsQueryStr})
            ) * 30
          + CASE WHEN is_in_stock THEN 0.5 ELSE 0.0 END
        ) AS score
      FROM awin_products
      WHERE search_vector @@ to_tsquery('english', ${tsQueryStr})
      ORDER BY score DESC, search_price ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return rows.map((row) => ({
      product: rowToAwinProduct(row),
      score: parseFloat(row.score) || 0,
      feedId: "db",
    }));
  }

  /**
   * Get store statistics.
   */
  async getStats(): Promise<{
    totalProducts: number;
    lastImport: Date | null;
  }> {
    const result = await sql`
      SELECT
        COUNT(*) AS total,
        MAX(imported_at) AS last_import
      FROM awin_products
    `;

    return {
      totalProducts: parseInt(result[0].total, 10) || 0,
      lastImport: result[0].last_import
        ? new Date(result[0].last_import)
        : null,
    };
  }

  /**
   * Verify the database is ready (table exists with data).
   */
  async ensureReady(): Promise<void> {
    if (!sql) {
      throw new Error(
        "[awin-store] DATABASE_URL not configured — cannot use database store"
      );
    }

    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'awin_products' AND table_schema = 'public'
      ) AS table_exists
    `;

    if (!result[0].table_exists) {
      throw new Error(
        "[awin-store] awin_products table not found. Run: pnpm run db:migrate && pnpm run import-csv"
      );
    }
  }
}

/**
 * Map a database row back to an AwinProduct object.
 * Handles column renames: fashion_material -> Fashion:material, etc.
 */
function rowToAwinProduct(row: Record<string, unknown>): AwinProduct {
  return {
    aw_product_id: String(row.aw_product_id ?? ""),
    product_name: String(row.product_name ?? ""),
    brand_name: String(row.brand_name ?? ""),
    aw_image_url: String(row.aw_image_url ?? ""),
    merchant_image_url: String(row.merchant_image_url ?? ""),
    large_image: String(row.large_image ?? ""),
    search_price: String(row.search_price ?? "0"),
    store_price: row.store_price ? String(row.store_price) : undefined,
    display_price: row.display_price ? String(row.display_price) : undefined,
    rrp_price: row.rrp_price ? String(row.rrp_price) : undefined,
    savings_percent: row.savings_percent
      ? String(row.savings_percent)
      : undefined,
    currency: String(row.currency ?? "USD"),
    aw_deep_link: String(row.aw_deep_link ?? ""),
    merchant_deep_link: String(row.merchant_deep_link ?? ""),
    merchant_name: String(row.merchant_name ?? ""),
    description: String(row.description ?? ""),
    product_short_description: row.product_short_description
      ? String(row.product_short_description)
      : undefined,
    category_name: String(row.category_name ?? ""),
    merchant_category: row.merchant_category
      ? String(row.merchant_category)
      : undefined,
    product_type: row.product_type ? String(row.product_type) : undefined,
    colour: row.colour ? String(row.colour) : undefined,
    in_stock: row.in_stock ? String(row.in_stock) : undefined,
    stock_status: row.stock_status ? String(row.stock_status) : undefined,
    keywords: row.keywords ? String(row.keywords) : undefined,
    // Map DB columns back to the AwinProduct field names used by mapToProduct
    "Fashion:material": row.fashion_material
      ? String(row.fashion_material)
      : undefined,
    "Fashion:size": row.fashion_size ? String(row.fashion_size) : undefined,
    product_model: row.product_model ? String(row.product_model) : undefined,
    model_number: row.model_number ? String(row.model_number) : undefined,
  };
}
