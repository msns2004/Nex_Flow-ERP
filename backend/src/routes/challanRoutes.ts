import { Router } from "express";

import {
    createChallan,
    getChallans,
    getChallanById,
    confirmChallan,
    requestChallanApproval,
    cancelChallan
} from "../controllers/challanController";

import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorizationMiddleware";

const router = Router();

// All challan endpoints require authentication
router.use(authenticateToken);

router.post("/:id/cancel", authorizeRoles("admin", "sales"), cancelChallan);
router.post("/:id/request-approval", authorizeRoles("admin", "sales"), requestChallanApproval);
router.post("/", authorizeRoles("admin", "sales"), createChallan);
router.get("/", getChallans);
router.post("/:id/confirm", authorizeRoles("admin"), confirmChallan);
router.get("/:id", getChallanById);

export default router;