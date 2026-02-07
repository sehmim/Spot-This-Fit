import "dotenv/config";
import postgres from "postgres";
import { getTextEmbeddings, toVectorLiteral } from "../services/embeddings.js";

const BATCH_SIZE = Number(process.env.EMBED_BATCH_SIZE ?? 200);
const START_OFFSET = Number(process.env.EMBED_START_OFFSET ?? 0);

function buildEmbeddingText(row: Record<string, unknown>): string {
  const parts = [
    row.product_name,
    row.brand_name,
    row.colour,
    row.category_name,
    row.product_type,
    row.description,
  ];
  return parts
    .map((value) => (value ? String(value) : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function embedBatch(
  sql: postgres.Sql,
  rows: Record<string, unknown>[]
) {
  const texts = rows.map(buildEmbeddingText);
  const embeddings = await getTextEmbeddings(texts);

  const records = rows
    .map((row, index) => ({
      id: String(row.aw_product_id),
      embedding: embeddings[index],
    }))
    .filter((item) => item.embedding.length > 0);

  if (records.length === 0) return 0;

  const values: Array<string | number[]> = [];
  const placeholders = records.map((record, index) => {
    const base = index * 2;
    values.push(record.id, record.embedding);
    return `($${base + 1}, $${base + 2}::vector)`;
  });

  await sql.unsafe(
    `
      INSERT INTO awin_product_embeddings (aw_product_id, embedding, updated_at)
      VALUES ${placeholders.join(",")}
      ON CONFLICT (aw_product_id)
      DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
    `,
    values.map((value) =>
      Array.isArray(value) ? toVectorLiteral(value) : value
    )
  );

  return records.length;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[embeddings] DATABASE_URL not set");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("[embeddings] OPENAI_API_KEY not set");
    process.exit(1);
  }

  const sql = postgres(url, { max: 3 });

  try {
    const totalResult = await sql`
      SELECT COUNT(*) AS total FROM awin_products
    `;
    const total = parseInt(totalResult[0].total, 10) || 0;

    console.log(
      `[embeddings] Starting embedding build (${total} products, batch ${BATCH_SIZE})`
    );

    let offset = START_OFFSET;
    let processed = 0;

    while (offset < total) {
      const rows = await sql`
        SELECT aw_product_id, product_name, brand_name, colour,
               category_name, product_type, description
        FROM awin_products
        ORDER BY aw_product_id
        LIMIT ${BATCH_SIZE}
        OFFSET ${offset}
      `;

      if (rows.length === 0) break;

      const inserted = await embedBatch(sql, rows);
      processed += inserted;
      offset += rows.length;

      console.log(
        `[embeddings] Processed ${Math.min(offset, total)}/${total} (embedded ${processed})`
      );
    }

    console.log("[embeddings] Done");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("[embeddings] Failed:", err);
  process.exit(1);
});
