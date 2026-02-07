import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { routes } from "./routes/index.js";

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: corsOrigins,
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(requestLogger);

// Serve static video files
app.use("/videos", express.static(path.resolve(__dirname, "../../videos")));

app.use("/api", routes);
app.use(errorHandler);

export { app };

// Testing