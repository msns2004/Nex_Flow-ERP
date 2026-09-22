import { Router } from "express";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    approveProduct,
    cancelProduct
} from "../controllers/productController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Every product endpoint requires login
router.use(authenticateToken);

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);

router.post("/:id/approve", approveProduct);
router.post("/:id/cancel", cancelProduct);

export default router;