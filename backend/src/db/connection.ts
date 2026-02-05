import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL not set — database features will be unavailable"
  );
}

export const sql = DATABASE_URL
  ? postgres(DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : (null as unknown as postgres.Sql);

export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end();
    console.log("[db] Connection pool closed");
  }
}
