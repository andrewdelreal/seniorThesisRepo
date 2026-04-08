import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { getTickers } from "../services/tickerService";

interface Ticker {
    name: string,
    symbol: string
}

export const tickerController = async (req: Request, res: Response) => {
    const { exchange }: {exchange: string} = req.body;

    if (!exchange) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data: Ticker[] | null = await getTickers(exchange);

    res.status(200).json({
        success: true,
        data,
    });
}