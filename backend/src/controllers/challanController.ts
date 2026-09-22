import { Request, Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middleware/authMiddleware";

export const createChallan = async (req: AuthRequest, res: Response) => {
    console.log("🔥 CHALLAN CUSTOMER ID RECEIVED:", req.body.customer_id);
    
    const client = await pool.connect();

    try {
        const {
            customer_id,
            tax_percent = 0,
            items
        } = req.body;

        if (!customer_id) {
            return res.status(400).json({
                message: "Customer ID is required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one item is required"
            });
        }

        await client.query("BEGIN");

        // Check customer
        const customerResult = await client.query(
            `SELECT id, name
             FROM customers
             WHERE id = $1`,
            [customer_id]
        );

        if (customerResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Customer not found"
            });
        }

        let subtotal = 0;
        const processedItems = [];

        // Check products and calculate totals
        for (const item of items) {
            if (!item.product_id || !item.quantity || Number(item.quantity) <= 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Each item requires a product ID and positive quantity"
                });
            }

            const productResult = await client.query(
                `SELECT id, name, sku, price, stock_quantity
                 FROM products
                 WHERE id = $1`,
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: `Product not found: ${item.product_id}`
                });
            }

            const product = productResult.rows[0];

            const quantity = Number(item.quantity);
            const unitPrice = Number(product.price);
            const total = quantity * unitPrice;

            subtotal += total;

            processedItems.push({
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                quantity,
                unit_price: unitPrice,
                total
            });
        }

        const taxPercent = Number(tax_percent);

        if (taxPercent < 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Tax percent cannot be negative"
            });
        }

        const taxAmount = subtotal * (taxPercent / 100);
        const grandTotal = subtotal + taxAmount;

        // Generate challan number
        const challanNumber = `CH-${Date.now()}`;

       const initialStatus =
    req.user?.role === "admin"
        ? "PENDING_APPROVAL"
        : "DRAFT";

        const challanResult = await client.query(
            `INSERT INTO sales_challans
             (
                challan_number,
                customer_id,
                subtotal,
                tax_percent,
                tax_amount,
                grand_total,
                status,
                created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
          [
    challanNumber,
    customer_id,
    subtotal,
    taxPercent,
    taxAmount,
    grandTotal,
    initialStatus,
    req.user?.userId || null
]
        );

        const challan = challanResult.rows[0];

        // Insert challan items
        for (const item of processedItems) {
            await client.query(
                `INSERT INTO sales_challan_items
                 (
                    challan_id,
                    product_id,
                    quantity,
                    unit_price,
                    total
                 )
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    challan.id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.total
                ]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Challan created successfully",
            challan: {
                ...challan,
                items: processedItems
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create challan error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};


export const getChallans = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        console.log("GET CHALLANS USER:", req.user);

        let query = `
            SELECT
                sc.id,
                sc.challan_number,
                sc.customer_id,
                c.name AS customer_name,
                sc.subtotal,
                sc.tax_percent,
                sc.tax_amount,
                sc.grand_total,
               sc.status,
sc.created_by,
u.name AS created_by_name,
sc.created_at,
sc.updated_at
            FROM sales_challans sc
JOIN customers c
  ON c.id = sc.customer_id
LEFT JOIN users u
  ON u.id = sc.created_by
        `;

        const params: string[] = [];

        // Sales can see only their own challans
        if (req.user?.role !== "admin") {
            query += ` WHERE sc.created_by = $1`;
            params.push(req.user!.userId);
        }

        query += ` ORDER BY sc.created_at DESC`;

        console.log("GET CHALLANS QUERY:", query);
console.log("GET CHALLANS PARAMS:", params);

        const result = await pool.query(query, params);

        console.log("CHALLANS RETURNED:", result.rows);

        res.json({
            challans: result.rows
        });

    } catch (error) {
        console.error("Get challans error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};


export const getChallanById = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const challanResult = await pool.query(
            `SELECT
                sc.id,
                sc.challan_number,
                sc.customer_id,
                c.name AS customer_name,
                sc.subtotal,
                sc.tax_percent,
                sc.tax_amount,
                sc.grand_total,
                sc.status,
                sc.created_by,
                sc.created_at,
                sc.updated_at
             FROM sales_challans sc
             JOIN customers c
               ON c.id = sc.customer_id
             WHERE sc.id = $1`,
            [id]
        );

        if (challanResult.rows.length === 0) {
            return res.status(404).json({
                message: "Challan not found"
            });
        }

        const itemsResult = await pool.query(
            `SELECT
                sci.id,
                sci.product_id,
                p.name AS product_name,
                p.sku,
                sci.quantity,
                sci.unit_price,
                sci.total
             FROM sales_challan_items sci
             JOIN products p
               ON p.id = sci.product_id
             WHERE sci.challan_id = $1`,
            [id]
        );

        res.json({
            challan: challanResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error("Get challan error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const confirmChallan = async (
    req: AuthRequest,
    res: Response
) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        // Find the challan
        const challanResult = await client.query(
            `SELECT id, challan_number, status
             FROM sales_challans
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (challanResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Challan not found"
            });
        }

        const challan = challanResult.rows[0];

        /// Only PENDING_APPROVAL challans can be confirmed
        if (challan.status !== "PENDING_APPROVAL") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Challan cannot be confirmed because its status is ${challan.status}`
            });
        }

        // Get challan items and current stock
        const itemsResult = await client.query(
            `SELECT
                sci.product_id,
                sci.quantity,
                p.name,
                p.stock_quantity
             FROM sales_challan_items sci
             JOIN products p
               ON p.id = sci.product_id
             WHERE sci.challan_id = $1
             FOR UPDATE`,
            [id]
        );

        if (itemsResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Challan has no items"
            });
        }

        // Check stock BEFORE changing anything
        for (const item of itemsResult.rows) {
            const currentStock = Number(item.stock_quantity);
            const requiredQuantity = Number(item.quantity);

            if (requiredQuantity > currentStock) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Insufficient stock",
                    product: item.name,
                    current_stock: currentStock,
                    required_quantity: requiredQuantity
                });
            }
        }

        // Deduct stock and create inventory movement
        for (const item of itemsResult.rows) {
            const currentStock = Number(item.stock_quantity);
            const quantity = Number(item.quantity);
            const newStock = currentStock - quantity;

            await client.query(
                `UPDATE products
                 SET stock_quantity = $1
                 WHERE id = $2`,
                [newStock, item.product_id]
            );

            await client.query(
                `INSERT INTO stock_movements
                 (product_id, movement_type, quantity, reference, reason, created_by)
                 VALUES ($1, 'OUT', $2, $3, $4, $5)`,
                [
                    item.product_id,
                    quantity,
                    challan.challan_number,
                    "Sales challan confirmed",
                    req.user?.userId || null
                ]
            );
        }

        // Mark challan as CONFIRMED
        const updatedChallan = await client.query(
            `UPDATE sales_challans
             SET status = 'CONFIRMED',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Challan confirmed successfully",
            challan: updatedChallan.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Confirm challan error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};

export const requestChallanApproval = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE sales_challans
             SET status = 'PENDING_APPROVAL',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
               AND status = 'DRAFT'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Only DRAFT challans can be sent for approval"
            });
        }

        res.json({
            message: "Challan sent to admin for approval",
            challan: result.rows[0]
        });

    } catch (error) {
        console.error("Request challan approval error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const cancelChallan = async (
    req: AuthRequest,
    res: Response
) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        const challanResult = await client.query(
            `SELECT id, challan_number, status
             FROM sales_challans
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (challanResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Challan not found"
            });
        }

        const challan = challanResult.rows[0];

        // Only DRAFT or PENDING_APPROVAL challans can be cancelled
        if (
            challan.status !== "DRAFT" &&
            challan.status !== "PENDING_APPROVAL"
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Challan cannot be cancelled because its status is ${challan.status}`
            });
        }

        const updatedChallan = await client.query(
            `UPDATE sales_challans
             SET status = 'CANCELLED',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Challan cancelled successfully",
            challan: updatedChallan.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Cancel challan error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    } finally {
        client.release();
    }
};