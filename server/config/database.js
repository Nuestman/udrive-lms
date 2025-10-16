/**
 * Database Configuration
 * 
 * Centralized database connection settings for PostgreSQL/Supabase
 */

import dotenv from 'dotenv';

dotenv.config();

// Environment checks
export const isProduction = process.env.NODE_ENV === 'production';
export const isSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase');

/**
 * Get database configuration
 * Supports both connection string (Supabase/Production) and individual params (Local Dev)
 */
export function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    // Connection string mode (Supabase or Production)
    return {
      connectionString: process.env.DATABASE_URL,
      // SSL settings for Supabase and production
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
    };
  } else {
    // Individual params mode (Local development)
    return {
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
  }
}

/**
 * Get database connection info for logging
 */
export function getConnectionInfo(config) {
  const dbName = config.database || (process.env.DATABASE_URL ? 'Supabase PostgreSQL' : 'Unknown');
  const environment = isProduction ? '🚀 PRODUCTION' : '🔧 DEVELOPMENT';
  const dbType = isSupabase ? '☁️  Supabase' : '💻 Local PostgreSQL';
  
  return {
    dbName,
    environment,
    dbType,
    hasSSL: !!config.ssl
  };
}

export default {
  getDatabaseConfig,
  getConnectionInfo,
  isProduction,
  isSupabase
};

