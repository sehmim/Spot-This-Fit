import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[SpotThisFit API] Running on http://localhost:${PORT}`);
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your-api-key-here") {
    console.log("[SpotThisFit API] OpenAI API key configured — AI analysis enabled");
  } else {
    console.log("[SpotThisFit API] No OpenAI API key — using mock data");
  }
});
