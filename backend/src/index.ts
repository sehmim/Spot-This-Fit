import "dotenv/config";
import { app } from "./app.js";
import { closeDb } from "./db/connection.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`[SpotThisFit API] Running on http://localhost:${PORT}`);
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-api-key-here") {
    console.log("[SpotThisFit API] OpenAI API key configured — AI analysis enabled");
  } else {
    console.log("[SpotThisFit API] No OpenAI API key — using mock data");
  }
  if (process.env.DATABASE_URL) {
    console.log("[SpotThisFit API] PostgreSQL configured — database store enabled");
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[SpotThisFit API] SIGTERM received, shutting down...");
  server.close();
  await closeDb();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[SpotThisFit API] SIGINT received, shutting down...");
  server.close();
  await closeDb();
  process.exit(0);
});
