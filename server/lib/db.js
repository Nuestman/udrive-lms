// Database connection for server
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration from environment variables
// Support both connection string and individual params (like user's working app)
const config = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.PGHOST || process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.PGPORT || process.env.DATABASE_PORT || '5432'),
      database: process.env.PGDATABASE || process.env.DATABASE_NAME || 'udrive-from-bolt',
      user: process.env.PGUSER || process.env.DATABASE_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Create connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database:', config.database);
});

/**
 * Query the database
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
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

