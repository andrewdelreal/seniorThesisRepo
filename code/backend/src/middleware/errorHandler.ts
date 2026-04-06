import { Request, Response, NextFunction } from "express";
import  ApiError  from "../errors/ApiError";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Something went wrong";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  console.error("[ERROR]", {
    code,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}