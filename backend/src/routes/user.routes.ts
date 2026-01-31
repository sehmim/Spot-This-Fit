import { Router } from "express";
import { captureEmail } from "../controllers/user.controller";

const router = Router();

router.post("/email", captureEmail);

export { router as userRoutes };
