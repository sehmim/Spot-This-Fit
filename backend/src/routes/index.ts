import { Router } from "express";
import { videoRoutes } from "./video.routes.js";
import { searchRoutes } from "./search.routes.js";
import { userRoutes } from "./user.routes.js";
import { downloadRoutes } from "./download.routes.js";

const router = Router();

router.use("/video", videoRoutes);
router.use("/video", downloadRoutes);
router.use("/search", searchRoutes);
router.use("/user", userRoutes);

export { router as routes };
