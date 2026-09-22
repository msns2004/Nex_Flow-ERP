import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { pool } from "../db";

export const createCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

const result = await pool.query(
    `INSERT INTO customers
     (name, email, phone, address, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, phone, address, created_by, status, created_at`,
    [
        name,
        email || null,
        phone || null,
        address || null,
        req.user?.userId || null,
        "PENDING_APPROVAL"
    ]
);
        res.status(201).json({
            message: "Customer created successfully",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Create customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getCustomers = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        let query = `
            SELECT
                c.id,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.created_by,
                u.name AS created_by_name,
                c.status,
                c.created_at
            FROM customers c
            LEFT JOIN users u
                ON u.id = c.created_by
        `;

        const params: string[] = [];

        // Sales users can see only their own customers
        if (req.user?.role !== "admin") {
            query += ` WHERE c.created_by = $1`;
            params.push(req.user!.userId);
        }

        query += ` ORDER BY c.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            customers: result.rows
        });

    } catch (error) {
        console.error("Get customers error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, name, email, phone, address, created_at
             FROM customers
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Get customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Customer name is required"
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET name = $1,
                 email = $2,
                 phone = $3,
                 address = $4
             WHERE id = $5
             RETURNING id, name, email, phone, address, created_at`,
            [
                name,
                email || null,
                phone || null,
                address || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer updated successfully",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Update customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM customers
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }

        res.json({
            message: "Customer deleted successfully"
        });

    } catch (error) {
        console.error("Delete customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const approveCustomer = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        // Only admin can approve customers
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can approve customers"
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET status = 'APPROVED'
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             RETURNING id, name, email, phone, address,
                       created_by, status, created_at`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Pending customer not found"
            });
        }

        res.json({
            message: "Customer approved successfully",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Approve customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const cancelCustomer = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        // Only admin can cancel customers
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can cancel customers"
            });
        }

        const result = await pool.query(
            `UPDATE customers
             SET status = 'CANCELLED'
             WHERE id = $1
               AND status = 'PENDING_APPROVAL'
             RETURNING id, name, email, phone, address,
                       created_by, status, created_at`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Pending customer not found"
            });
        }

        res.json({
            message: "Customer cancelled successfully",
            customer: result.rows[0]
        });

    } catch (error) {
        console.error("Cancel customer error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};