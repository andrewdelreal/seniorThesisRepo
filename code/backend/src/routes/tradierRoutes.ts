import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import  ApiError  from "../errors/ApiError";
import { getMarketHistory } from "../services/tradierService";
// import authenticate from "../middleware/authenticate";

const router = Router();

router.post('/api/tradier/markets/history', asyncHandler( async (req: Request, res: Response) => {
    const { symbol, interval, start, end } = req.body;

    if (!symbol || !interval || !start || !end) {
      throw new ApiError(
        400,
        "INVALID_REQUEST",
        "Missing required parameters"
      );
    }

    const data = await getMarketHistory(symbol, interval, start, end);

    res.status(200).json({
        success: true,
        data,
    });
}));

export default router;