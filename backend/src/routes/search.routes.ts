import { Router } from "express";
import {
  createSearch,
  searchCjProducts,
  searchAwinProducts,
  searchProductSuggestions,
  getSearchStatus,
  getSearchResults,
  createFrameSearch,
  streamSearchResults,
  imageSearch,
} from "../controllers/search.controller.js";

const router = Router();

// Existing routes
router.post("/", createSearch);
router.get("/", searchCjProducts);
router.get("/awin", searchAwinProducts);
router.get("/suggestions", searchProductSuggestions);
router.get("/:searchId/status", getSearchStatus);
router.get("/:searchId/results", getSearchResults);

// New routes for frame-based search
router.post("/frame", createFrameSearch);
router.get("/:searchId/stream", streamSearchResults);

// Pinecone image search
router.post("/image", imageSearch);

export { router as searchRoutes };
