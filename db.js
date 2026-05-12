const mysql = require('mysql2/promise');
require('dotenv').config();

// Fallback credentials if .env fails
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'musicapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log(`[DATABASE] Connecting to ${dbConfig.database} as ${dbConfig.user}...`);

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('[DATABASE] ✅ Connection Successful');
        conn.release();
    })
    .catch(err => {
        console.error('[DATABASE] ❌ Connection Failed:', err.message);
    });

module.exports = pool;
