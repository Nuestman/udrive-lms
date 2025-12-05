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
  
  // Allowed custom domains (add more domains here as needed)
  // Supports main domain and all subdomains (e.g., sunlms.com, www.sunlms.com, app.sunlms.com)
  // IMPORTANT: Only add domains you own and control
  ALLOWED_DOMAINS: [
    'sunlms.com',
    'medupskill.com',
    // Add more domains here: 'example.com', 'another-domain.com'
  ],
  
  // Allowed Vercel project names (for preview deployments)
  // Only add your actual Vercel project names to prevent unauthorized access
  // Leave empty array to disable Vercel wildcard access
  ALLOWED_VERCEL_PROJECTS: [
    // 'sunlms', 'udrive-lms', // Add your actual Vercel project names here
  ],
      // Commented out for now to disable Vercel wildcard access
      // Allow ALL Vercel deployments (preview, production, any subdomain)
      // This includes: sunlms.vercel.app, udrive-lms.vercel.app, project-name-*.vercel.app, etc.
        //   if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
        //     return callback(null, true);
  
  // CORS settings
  CORS_OPTIONS: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
      // Note: This is generally safe as CORS only applies to cross-origin requests
      // Same-origin requests don't include an Origin header
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
      
      // Allow specific Vercel project deployments (more secure than wildcard)
      if (APP_CONFIG.ALLOWED_VERCEL_PROJECTS.length > 0) {
        for (const project of APP_CONFIG.ALLOWED_VERCEL_PROJECTS) {
          const escapedProject = project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Match production: project.vercel.app
          // Match preview: project-git-*.vercel.app
          if (origin.match(new RegExp(`^https:\\/\\/(${escapedProject}|${escapedProject}-git-[^.]+)\\.vercel\\.app$`))) {
            return callback(null, true);
          }
        }
      }
      
      // Allow custom domains and all their subdomains (http and https)
      // This includes: sunlms.com, www.sunlms.com, app.sunlms.com, medupskill.com, etc.
      // Security: The $ anchor ensures it ends with the domain, preventing subdomain spoofing
      // (e.g., evil-sunlms.com won't match because it doesn't end with sunlms.com)
      for (const domain of APP_CONFIG.ALLOWED_DOMAINS) {
        try {
          const url = new URL(origin);
          const hostname = url.hostname;
          
          // Check if hostname exactly matches the domain (e.g., sunlms.com)
          if (hostname === domain) {
            return callback(null, true);
          }
          
          // Check if hostname ends with .domain (e.g., www.sunlms.com, staging.sunlms.com)
          if (hostname.endsWith('.' + domain)) {
            return callback(null, true);
          }
        } catch (e) {
          // If URL parsing fails, use regex fallback
          const escapedDomain = domain.replace(/\./g, '\\.');
          const domainPattern = new RegExp(`^https?:\\/\\/.*${escapedDomain}$`);
          if (domainPattern.test(origin)) {
            return callback(null, true);
          }
        }
      }
      
      // Log blocked origin for debugging (enable in production temporarily if needed)
      console.log('🚫 [CORS] Blocked origin:', origin);
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

