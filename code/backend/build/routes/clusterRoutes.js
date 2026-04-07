"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const authenticate_1 = __importDefault(require("../middleware/authenticate"));
const clusterControllers_1 = require("../controllers/clusterControllers");
const router = (0, express_1.Router)();
router.post('/api/cluster', authenticate_1.default, (0, asyncHandler_1.asyncHandler)(clusterControllers_1.clusterController));
exports.default = router;
