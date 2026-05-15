import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Direct configuration without parsing URL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'everace',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // For AWS RDS, you might need these:
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
       
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check if DB_HOST is correct (AWS RDS endpoint)');
        console.log('2. Verify DB_USER and DB_PASSWORD');
        console.log('3. Ensure security group allows inbound traffic on port 3306');
        console.log('4. Check if database "everace" exists');
        console.log('5. For AWS RDS, check if public accessibility is enabled');
        return false;
    }
};

export { pool, testConnection };