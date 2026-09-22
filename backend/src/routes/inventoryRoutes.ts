import { Router } from "express";
import {
    stockIn,
    stockOut,
    getStockMovements,
    approveStockMovement,
    cancelStockMovement
} from "../controllers/inventoryController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Every inventory endpoint requires authentication
router.use(authenticateToken);

router.post("/in", stockIn);
router.post("/out", stockOut);
router.get("/movements", getStockMovements);
router.post("/:id/approve", approveStockMovement);
router.post("/:id/cancel", cancelStockMovement);

export default router;