import { Router } from "express";
import { validateVideo, getVideoMeta } from "../controllers/video.controller";

const router = Router();

router.post("/validate", validateVideo);
router.get("/:videoId/meta", getVideoMeta);

export { router as videoRoutes };
