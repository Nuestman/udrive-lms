// Database connection for server
import pg from 'pg';
import { getDatabaseConfig, getConnectionInfo, isProduction, isSupabase } from '../config/database.js';

const { Pool } = pg;

// Get database configuration from centralized config
const config = getDatabaseConfig();

// Create connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection
pool.on('connect', () => {
  const { dbName, environment, dbType, hasSSL } = getConnectionInfo(config);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Database Connected`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Type: ${dbType}`);
  console.log(`   Database: ${dbName}`);
  if (hasSSL) {
    console.log(`   SSL: ✅ Enabled`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

/**
 * Query the database
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (!isProduction) {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Close the database pool
 */
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

// Export the pool for direct access if needed
export { pool };

export default {
  query,
  getClient,
  closePool,
  pool,
};

