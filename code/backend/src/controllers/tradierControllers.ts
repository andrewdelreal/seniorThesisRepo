import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { getMarketHistory } from "../services/tradierService";

interface MarketHistoryRequestBody {
    symbol: string, 
    interval: string, 
    start: string, 
    end: string
};

interface MarketHistoryData {
    xValues: number[], 
    yValues: number[]
};

export const getMarketHistoryController = async (req: Request, res: Response) => {
    const { symbol, interval, start, end }: MarketHistoryRequestBody = req.body;

    if (!symbol || !interval || !start || !end) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data: MarketHistoryData = await getMarketHistory(symbol, interval, start, end);

    res.status(200).json({
        success: true,
        data,
    });
}
