import { Router } from "express";
import {
  createSearch,
  getSearchStatus,
  getSearchResults,
  createFrameSearch,
  streamSearchResults,
} from "../controllers/search.controller";

const router = Router();

// Existing routes
router.post("/", createSearch);
router.get("/:searchId/status", getSearchStatus);
router.get("/:searchId/results", getSearchResults);

// New routes for frame-based search
router.post("/frame", createFrameSearch);
router.get("/:searchId/stream", streamSearchResults);

export { router as searchRoutes };
