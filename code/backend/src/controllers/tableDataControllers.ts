import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { getStockTableData } from "../services/tableDataServices";

export const tableDataController = async (req: Request, res: Response) => {
    const { date } = req.body;

    if (!date) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data = await getStockTableData(date);

    res.status(200).json({
        success: true,
        data,
    });
}