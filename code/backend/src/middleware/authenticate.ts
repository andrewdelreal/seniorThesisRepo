import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import  ApiError  from "../errors/ApiError";

const APP_JWT_SECRET: string = process.env.APP_JWT_SECRET!;

export default function authenticate(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.headers.authorization;

  if (!token) {
    throw new ApiError(
        401,
        "AUTH_MISSING_TOKEN",
        "Missing token"
    );
  }

  try {
    const decoded = jwt.verify(token, APP_JWT_SECRET) as { googleId: string };
    (req as any).googleId = decoded.googleId;
    next();
  } catch {
    throw new ApiError(403, "AUTH_INVALID_TOKEN", "Invalid token");
  }
}