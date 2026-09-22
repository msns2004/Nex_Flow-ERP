import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export const testDatabaseConnection = async () => {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ Database connected successfully!");
        console.log("Database time:", result.rows[0].now);
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
};