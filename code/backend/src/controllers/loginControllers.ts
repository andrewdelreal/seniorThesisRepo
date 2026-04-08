import { Request, Response } from "express";
import  ApiError  from "../errors/ApiError";
import { verifyLogin } from "../services/loginService";

export const loginController = async (req: Request, res: Response) => {
    const { token }: { token: string } = req.body;

    // If token is missing
    if (!token) {
        throw new ApiError(
            400,
            "INVALID_REQUEST",
            "Missing required parameters"
        );
    }

    // Verify and generate app token
    const data = await verifyLogin(token);

    res.status(200).json({
        success: true,
        data,
    });
}