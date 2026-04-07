"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const loginControllers_1 = require("../controllers/loginControllers");
const router = (0, express_1.Router)();
router.post('/api/auth/google', (0, asyncHandler_1.asyncHandler)(loginControllers_1.loginController));
exports.default = router;
