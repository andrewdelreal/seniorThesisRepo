import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { getTickers } from "../services/tickerService";

export const tickerController = async (req: Request, res: Response) => {
    const { exchange } = req.body;

    if (!exchange) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data = await getTickers(exchange);

    res.status(200).json({
        success: true,
        data,
    });
}