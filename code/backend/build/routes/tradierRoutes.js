"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const authenticate_1 = __importDefault(require("../middleware/authenticate"));
const tradierControllers_1 = require("../controllers/tradierControllers");
const router = (0, express_1.Router)();
router.post('/api/tradier/markets/history', authenticate_1.default, (0, asyncHandler_1.asyncHandler)(tradierControllers_1.getMarketHistoryController));
exports.default = router;
