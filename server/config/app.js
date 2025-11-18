/**
 * Application Configuration
 * 
 * General app settings including JWT, server ports, CORS, etc.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Application settings
 */
export const APP_CONFIG = {
  // Server settings
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT settings
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // CORS settings
  CORS_OPTIONS: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In development, allow localhost and local network IPs
      if (process.env.NODE_ENV === 'development') {
        // Allow localhost on any port
        if (origin.match(/^http:\/\/localhost(:\d+)?$/)) {
          return callback(null, true);
        }
        
        // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (origin.match(/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
          return callback(null, true);
        }
      }
      
      // In production, allow configured frontend URL and Vercel preview deployments
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Allow exact match
      if (origin === allowedOrigin) {
        return callback(null, true);
      }
      
      // Allow ALL Vercel deployments (preview, production, any subdomain)
      // This includes: sunlms.vercel.app, udrive-lms.vercel.app, project-name-*.vercel.app, etc.
      if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      
      // Also allow Vercel preview URLs with git branch names
      if (origin.match(/^https:\/\/.*-git-.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  },
  
  // Logging
  ENABLE_REQUEST_LOGGING: process.env.NODE_ENV !== 'production',
  ENABLE_QUERY_LOGGING: process.env.NODE_ENV === 'development',
};

/**
 * Check if running in production
 */
export function isProduction() {
  return APP_CONFIG.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment() {
  return APP_CONFIG.NODE_ENV === 'development';
}

/**
 * Check if running in test mode
 */
export function isTest() {
  return APP_CONFIG.NODE_ENV === 'test';
}

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = [];
  const missing = [];

  // Only validate in production
  if (isProduction()) {
    required.push('JWT_SECRET', 'DATABASE_URL', 'BLOB_READ_WRITE_TOKEN');
  }

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

export default {
  APP_CONFIG,
  isProduction,
  isDevelopment,
  isTest,
  validateConfig
};

