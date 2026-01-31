import { Router } from "express";
import { downloadVideo } from "../controllers/download.controller";

const router = Router();

router.post("/download", downloadVideo);

export { router as downloadRoutes };
