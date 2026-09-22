import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { pool } from "../db";

export const createProduct = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const {
            sku,
            name,
            description,
            category,
            price,
            stock_quantity,
            min_stock_quantity,
            warehouse_location
        } = req.body;

        if (!sku || !name) {
            return res.status(400).json({
                message: "SKU and product name are required"
            });
        }

        if (price === undefined || Number(price) < 0) {
            return res.status(400).json({
                message: "Valid product price is required"
            });
        }

        if (!req.user?.userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const createdBy = req.user.userId;

// Every newly created product requires admin approval
const status = "PENDING_APPROVAL";

        const result = await pool.query(
            `INSERT INTO products
             (
                sku,
                name,
                description,
                category,
                price,
                stock_quantity,
                min_stock_quantity,
                warehouse_location,
                created_by,
                status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING
                id,
                sku,
                name,
                description,
                category,
                price,
                stock_quantity,
                min_stock_quantity,
                warehouse_location,
                created_by,
                status,
                created_at`,
            [
                sku,
                name,
                description || null,
                category || null,
                Number(price),
                stock_quantity !== undefined
                    ? Number(stock_quantity)
                    : 0,
                min_stock_quantity !== undefined
                    ? Number(min_stock_quantity)
                    : 0,
                warehouse_location || null,
                createdBy,
                status
            ]
        );

        res.status(201).json({
            message: "Product created successfully",
            product: result.rows[0]
        });

    } catch (error: any) {
        console.error("Create product error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists"
            });
        }

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getProducts = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        let query = `
            SELECT
                p.id,
                p.sku,
                p.name,
                p.description,
                p.category,
                p.price,
                p.stock_quantity,
                p.min_stock_quantity,
                p.warehouse_location,
                p.created_by,
                u.name AS created_by_name,
                p.status,
                p.created_at
            FROM products p
            LEFT JOIN users u
                ON u.id = p.created_by
        `;

        const params: string[] = [];

        // Sales can see only their own products
        if (req.user?.role !== "admin") {
            query += ` WHERE p.created_by = $1`;
            params.push(req.user!.userId);
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            products: result.rows
        });

    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, sku, name, description, category, price,
                    stock_quantity, min_stock_quantity,
                    warehouse_location, created_at
             FROM products
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const {
            sku,
            name,
            description,
            category,
            price,
            min_stock_quantity,
            warehouse_location
        } = req.body;

        if (!sku || !name) {
            return res.status(400).json({
                message: "SKU and product name are required"
            });
        }

        if (price === undefined || Number(price) < 0) {
            return res.status(400).json({
                message: "Valid product price is required"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET sku = $1,
                 name = $2,
                 description = $3,
                 category = $4,
                 price = $5,
                 min_stock_quantity = $6,
                 warehouse_location = $7
             WHERE id = $8
             RETURNING id, sku, name, description, category, price,
                       stock_quantity, min_stock_quantity,
                       warehouse_location, created_at`,
            [
                sku,
                name,
                description || null,
                category || null,
                Number(price),
                min_stock_quantity !== undefined
                    ? Number(min_stock_quantity)
                    : 0,
                warehouse_location || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product updated successfully",
            product: result.rows[0]
        });

    } catch (error: any) {
        console.error("Update product error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "SKU already exists"
            });
        }

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const approveProduct = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can approve products"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET status = 'APPROVED'
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             RETURNING id, sku, name, description, category,
                       price, stock_quantity, min_stock_quantity,
                       warehouse_location, created_by, status, created_at`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Pending product not found"
            });
        }

        res.json({
            message: "Product approved successfully",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Approve product error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};


export const cancelProduct = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can cancel products"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET status = 'CANCELLED'
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             RETURNING id, sku, name, description, category,
                       price, stock_quantity, min_stock_quantity,
                       warehouse_location, created_by, status, created_at`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Pending product not found"
            });
        }

        res.json({
            message: "Product cancelled successfully",
            product: result.rows[0]
        });

    } catch (error) {
        console.error("Cancel product error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};