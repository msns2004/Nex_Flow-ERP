import { Request, Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const stockIn = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();

    try {
        const { product_id, quantity, reason } = req.body;

        if (!product_id || !quantity || Number(quantity) <= 0) {
            return res.status(400).json({
                message: "Product ID and a positive quantity are required"
            });
        }

        await client.query("BEGIN");

        // Check that the product exists
        const productResult = await client.query(
            `SELECT id, name, stock_quantity
             FROM products
             WHERE id = $1`,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Create a pending inventory request.
        // Stock is NOT changed at this stage.
        const movementResult = await client.query(
            `INSERT INTO stock_movements
             (
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status
             )
             VALUES ($1, 'IN', $2, $3, $4, $5, 'PENDING_APPROVAL')
             RETURNING
                id,
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status,
                created_at`,
            [
                product_id,
                Number(quantity),
                "STOCK_IN",
                reason || null,
                req.user?.userId || null
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Stock IN request sent for admin approval",
            movement: movementResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Stock IN request error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const approveStockMovement = async (
    req: AuthRequest,
    res: Response
) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        // Only admin can approve inventory requests
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can approve inventory requests"
            });
        }

        await client.query("BEGIN");

        // Find and lock the pending inventory movement
        const movementResult = await client.query(
            `SELECT
                id,
                product_id,
                movement_type,
                quantity,
                status
             FROM stock_movements
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             FOR UPDATE`,
            [id]
        );

        if (movementResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Pending inventory request not found"
            });
        }

        const movement = movementResult.rows[0];

        // We are handling Stock IN approval here
      if (
    movement.movement_type !== "IN" &&
    movement.movement_type !== "OUT"
) {
    await client.query("ROLLBACK");
    return res.status(400).json({
        message: "Unsupported inventory movement type"
    });
}

        // Lock the product before changing its stock
        const productResult = await client.query(
            `SELECT
                id,
                name,
                stock_quantity
             FROM products
             WHERE id = $1
             FOR UPDATE`,
            [movement.product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = productResult.rows[0];

       const currentStock = Number(product.stock_quantity);
const movementQuantity = Number(movement.quantity);

let newStock: number;

if (movement.movement_type === "IN") {
    newStock = currentStock + movementQuantity;
} else {
    if (movementQuantity > currentStock) {
        await client.query("ROLLBACK");
        return res.status(400).json({
            message: "Insufficient stock to approve Stock OUT request"
        });
    }

    newStock = currentStock - movementQuantity;
}

await client.query(
    `UPDATE products
     SET stock_quantity = $1
     WHERE id = $2`,
    [newStock, product.id]
);
        // Mark inventory request as approved
        const updatedMovementResult = await client.query(
            `UPDATE stock_movements
             SET status = 'APPROVED'
             WHERE id = $1
             RETURNING
                id,
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status,
                created_at`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
           message:
    movement.movement_type === "IN"
        ? "Stock IN request approved successfully"
        : "Stock OUT request approved successfully",
            movement: updatedMovementResult.rows[0],
            product: {
                id: product.id,
                name: product.name,
                previous_stock: currentStock,
               movement_quantity: movementQuantity,
current_stock: newStock
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Approve stock movement error:",
            error
        );

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const cancelStockMovement = async (
    req: AuthRequest,
    res: Response
) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can cancel inventory requests"
            });
        }

        await client.query("BEGIN");

        const movementResult = await client.query(
            `SELECT
                id,
                product_id,
                movement_type,
                quantity,
                status
             FROM stock_movements
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             FOR UPDATE`,
            [id]
        );

        if (movementResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Pending inventory request not found"
            });
        }

        const movement = movementResult.rows[0];

        const updatedMovementResult = await client.query(
            `UPDATE stock_movements
             SET status = 'CANCELLED'
             WHERE id = $1
             RETURNING
                id,
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status,
                created_at`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Inventory request cancelled successfully",
            movement: updatedMovementResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Cancel stock movement error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const stockOut = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();

    try {
        const { product_id, quantity, reason } = req.body;

        if (!product_id || !quantity || Number(quantity) <= 0) {
            return res.status(400).json({
                message: "Product ID and a positive quantity are required"
            });
        }

        await client.query("BEGIN");

        const productResult = await client.query(
            `SELECT
                id,
                name,
                stock_quantity
             FROM products
             WHERE id = $1`,
            [product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = productResult.rows[0];

        const currentStock = Number(product.stock_quantity);
        const requestedQuantity = Number(quantity);

        if (requestedQuantity > currentStock) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        const movementResult = await client.query(
            `INSERT INTO stock_movements
             (
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status
             )
             VALUES ($1, 'OUT', $2, $3, $4, $5, 'PENDING_APPROVAL')
             RETURNING
                id,
                product_id,
                movement_type,
                quantity,
                reference,
                reason,
                created_by,
                status,
                created_at`,
            [
                product_id,
                requestedQuantity,
                "STOCK_OUT",
                reason || null,
                req.user?.userId || null
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Stock OUT request sent for admin approval",
            movement: movementResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Stock OUT request error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const getStockMovements = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const isAdmin = req.user?.role === "admin";

        const result = await pool.query(
            `SELECT
                sm.id,
                sm.product_id,
                p.name AS product_name,
                p.sku,
                sm.movement_type,
                sm.quantity,
                sm.reference,
                sm.reason,
                sm.created_by,
                u.name AS requested_by,
                sm.status,
                sm.created_at
             FROM stock_movements sm
             JOIN products p
               ON p.id = sm.product_id
             LEFT JOIN users u
               ON u.id = sm.created_by
             WHERE ($1 = true OR sm.created_by = $2)
             ORDER BY sm.created_at DESC`,
            [isAdmin, req.user?.userId]
        );

        res.json({
            movements: result.rows
        });

    } catch (error) {
        console.error("Get stock movements error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};