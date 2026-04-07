import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { verifyLogin } from "../services/loginService";

export const loginController = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    const data = await verifyLogin(token);

    res.status(200).json({
        success: true,
        data,
    });
}