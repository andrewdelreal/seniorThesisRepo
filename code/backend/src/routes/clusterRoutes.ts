import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import authenticate from "../middleware/authenticate";
import { clusterController } from "../controllers/clusterControllers";

const router = Router();

router.post('/api/cluster', authenticate, asyncHandler(clusterController));

export default router;
