import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { loginController } from "../controllers/loginControllers";

const router = Router();

router.post('/api/auth/google', asyncHandler(loginController));

export default router;