import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { cluster } from "../services/clusterServices";

export const clusterController = async (req: Request, res: Response) => {
    const { 
        date, 
        numClusters, 
        dimensionsCSV, 
        boolIsLog, 
        boolIsStandardized, 
        exchanges, 
        dimensionReduction 
    } = req.body;

    if (!date || !numClusters || !dimensionsCSV || boolIsLog === undefined || boolIsStandardized === undefined || !exchanges || !dimensionReduction) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data = await cluster(
        date, 
        numClusters, 
        dimensionsCSV, 
        boolIsLog, 
        boolIsStandardized, 
        exchanges, 
        dimensionReduction 
    );

    res.status(200).json({
        success: true,
        data,
    });
}