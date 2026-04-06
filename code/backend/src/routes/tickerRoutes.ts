import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import authenticate from "../middleware/authenticate";
import { tickerController } from "../controllers/tickerControllers";

const router = Router();

router.post('/api/tickers', authenticate, asyncHandler(tickerController));

export default router;