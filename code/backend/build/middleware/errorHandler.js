"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Something went wrong";
    if (err instanceof ApiError_1.default) {
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
