import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../db/migrations");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] DATABASE_URL not set");
    process.exit(1);
  }

  const sql = postgres(url);

  try {
    // Ensure _migrations table exists
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Get already-applied migrations
    const applied = await sql<{ name: string }[]>`
      SELECT name FROM _migrations ORDER BY name
    `;
    const appliedSet = new Set(applied.map((r) => r.name));

    // Read migration files
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrate] Already applied: ${file}`);
        continue;
      }

      const content = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`[migrate] Applying: ${file}...`);

      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx.unsafe("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      });

      console.log(`[migrate] Applied: ${file}`);
      count++;
    }

    if (count === 0) {
      console.log("[migrate] All migrations already applied");
    } else {
      console.log(`[migrate] Applied ${count} migration(s)`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
