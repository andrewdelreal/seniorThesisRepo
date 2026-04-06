"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        throw new ApiError_1.default(401, "AUTH_MISSING_TOKEN", "Missing token");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, APP_JWT_SECRET);
        req.googleId = decoded.googleId;
        next();
    }
    catch (_a) {
        throw new ApiError_1.default(403, "AUTH_INVALID_TOKEN", "Invalid token");
    }
}
