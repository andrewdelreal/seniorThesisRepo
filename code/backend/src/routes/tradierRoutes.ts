import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import authenticate from "../middleware/authenticate";
import { getMarketHistoryController } from "../controllers/tradierControllers";

const router = Router();

router.post('/api/tradier/markets/history', authenticate, asyncHandler(getMarketHistoryController));

export default router;