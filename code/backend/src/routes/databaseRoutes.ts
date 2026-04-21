import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import authenticate from "../middleware/authenticate";
import { tableDataController } from "../controllers/tableDataControllers";

const router = Router();

router.post('/api/tabledata', authenticate, asyncHandler(tableDataController));

export default router;