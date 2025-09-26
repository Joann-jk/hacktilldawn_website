import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hacktilldawn',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Get database connection
export function getConnection() {
    return pool;
}

// Execute query with error handling
export async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('Database query error:', error);
        return { success: false, error: error.message };
    }
}

// Close all connections
export async function closeConnections() {
    try {
        await pool.end();
        console.log('Database connections closed');
    } catch (error) {
        console.error('Error closing database connections:', error);
    }
}

export default pool;
