// Database connection for server
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration from environment variables
// Support both connection string (Supabase/Production) and individual params (Local Dev)
const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');

const config = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      // Supabase and production settings
      ssl: isSupabase || isProduction ? {
        rejectUnauthorized: false // Required for Supabase pooler
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for cloud connections
      // Connection pool settings for Supabase
      ...(isSupabase && {
        application_name: 'udrive_lms',
      })
    }
  : {
      // Local development configuration
      host: process.env.PGHOST || process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.PGPORT || process.env.DATABASE_PORT || '5432'),
      database: process.env.PGDATABASE || process.env.DATABASE_NAME || 'udrive-from-bolt',
      user: process.env.PGUSER || process.env.DATABASE_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: false,
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
  const dbName = config.database || process.env.DATABASE_URL ? 'Supabase PostgreSQL' : 'Unknown';
  const environment = isProduction ? '🚀 PRODUCTION' : '🔧 DEVELOPMENT';
  const dbType = isSupabase ? '☁️  Supabase' : '💻 Local PostgreSQL';
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Database Connected`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Type: ${dbType}`);
  console.log(`   Database: ${dbName}`);
  if (config.ssl) {
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

