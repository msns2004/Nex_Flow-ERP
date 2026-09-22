import { pool } from "../db";

const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(30) NOT NULL DEFAULT 'sales',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(150) NOT NULL,
                email VARCHAR(150),
                phone VARCHAR(30),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sku VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                price NUMERIC(12, 2) NOT NULL DEFAULT 0,
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT products_price_check
                    CHECK (price >= 0),

                CONSTRAINT products_stock_check
                    CHECK (stock_quantity >= 0)
            );

            CREATE TABLE IF NOT EXISTS stock_movements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL,
                movement_type VARCHAR(20) NOT NULL,
                quantity INTEGER NOT NULL,
                reference TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT stock_movement_quantity_check
                    CHECK (quantity > 0),

                CONSTRAINT stock_movement_type_check
                    CHECK (
                        movement_type IN ('IN', 'OUT')
                    ),

                CONSTRAINT fk_stock_product
                    FOREIGN KEY (product_id)
                    REFERENCES products(id)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS challans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                challan_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id UUID NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
                total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT challan_status_check
                    CHECK (
                        status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')
                    ),

                CONSTRAINT fk_challan_customer
                    FOREIGN KEY (customer_id)
                    REFERENCES customers(id)
                    ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS challan_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                challan_id UUID NOT NULL,
                product_id UUID NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(12, 2) NOT NULL,

                CONSTRAINT challan_item_quantity_check
                    CHECK (quantity > 0),

                CONSTRAINT challan_item_price_check
                    CHECK (unit_price >= 0),

                CONSTRAINT fk_challan_item_challan
                    FOREIGN KEY (challan_id)
                    REFERENCES challans(id)
                    ON DELETE CASCADE,

                CONSTRAINT fk_challan_item_product
                    FOREIGN KEY (product_id)
                    REFERENCES products(id)
                    ON DELETE RESTRICT
            );
        `);

        console.log("✅ All database tables created successfully!");
    } catch (error) {
        console.error("❌ Failed to create database tables:", error);
    } finally {
        await pool.end();
    }
};

createTables();