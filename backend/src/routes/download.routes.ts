import { Router } from "express";
import { downloadVideo } from "../controllers/download.controller.js";

const router = Router();

router.post("/download", downloadVideo);

export { router as downloadRoutes };
