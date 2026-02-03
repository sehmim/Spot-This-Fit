import { Router } from "express";
import {
  createSearch,
  searchCjProducts,
  getSearchStatus,
  getSearchResults,
  createFrameSearch,
  streamSearchResults,
} from "../controllers/search.controller.js";

const router = Router();

// Existing routes
router.post("/", createSearch);
router.get("/", searchCjProducts);
router.get("/:searchId/status", getSearchStatus);
router.get("/:searchId/results", getSearchResults);

// New routes for frame-based search
router.post("/frame", createFrameSearch);
router.get("/:searchId/stream", streamSearchResults);

export { router as searchRoutes };
