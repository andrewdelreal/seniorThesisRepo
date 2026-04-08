import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { cluster } from "../services/clusterServices";

interface ClusterRequestBody {
    date: string, 
    numClusters: number, 
    dimensions: string[], 
    boolIsLog: boolean, 
    boolIsStandardized: boolean, 
    exchanges: string[], 
    dimensionReduction: string 
}

export const clusterController = async (req: Request, res: Response) => {
    const { 
        date, 
        numClusters, 
        dimensions, 
        boolIsLog, 
        boolIsStandardized, 
        exchanges, 
        dimensionReduction 
    }: ClusterRequestBody = req.body;

    if (!date || !numClusters || !dimensions || boolIsLog === undefined || boolIsStandardized === undefined || !exchanges || !dimensionReduction) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data = await cluster(
        date, 
        numClusters, 
        dimensions, 
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
