import { Router } from "express";
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    approveCustomer,
    cancelCustomer
} from "../controllers/customerController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All customer routes require login
router.use(authenticateToken);

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

router.post("/:id/approve", approveCustomer);
router.post("/:id/cancel", cancelCustomer);

export default router;