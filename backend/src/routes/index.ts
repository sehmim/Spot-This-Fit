import { Router } from "express";
import { videoRoutes } from "./video.routes";
import { searchRoutes } from "./search.routes";
import { userRoutes } from "./user.routes";
import { downloadRoutes } from "./download.routes";

const router = Router();

router.use("/video", videoRoutes);
router.use("/video", downloadRoutes);
router.use("/search", searchRoutes);
router.use("/user", userRoutes);

export { router as routes };
