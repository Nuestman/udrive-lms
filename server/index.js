// Backend API Server
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import modulesRoutes from './routes/modules.js';
import studentsRoutes from './routes/students.js';
import enrollmentsRoutes from './routes/enrollments.js';
import analyticsRoutes from './routes/analytics.js';
import lessonsRoutes from './routes/lessons.js';
import schoolsRoutes from './routes/schools.js';
import progressRoutes from './routes/progress.js';
import quizRoutes from './routes/quiz.js';
import certificateRoutes from './routes/certificate.js';
import goalsRoutes from './routes/goals.js';
import usersRoutes from './routes/users.js';
import instructorsRoutes from './routes/instructors.js';
import mediaRoutes from './routes/media.js';
import settingsRoutes from './routes/settings.js';
import twoFactorAuthRoutes from './routes/twoFactorAuth.js';
import notificationRoutes from './routes/notifications.js';
import whiteLabelRoutes from './routes/whiteLabel.js';
import contactRoutes from './routes/contact.js';
import reviewsRoutes from './routes/reviews.js';
import announcementsRoutes from './routes/announcements.js';
import feedbackRoutes from './routes/feedback.js';
import testimonialsRoutes from './routes/testimonials.js';
import reviewSettingsRoutes from './routes/reviewSettings.js';
import courseSupportRoutes from './routes/courseSupport.js';
import scormRoutes from './routes/scorm.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { tenantContext } from './middleware/tenant.middleware.js';
import { pool } from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { APP_CONFIG, validateConfig } from './config/app.js';

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

const app = express();
const server = createServer(app);

// Initialize Socket.IO with permissive CORS matching app CORS options
// Socket.IO CORS: use function that returns true/false or the origin string
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow no-origin (same-origin, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      const allowedFrontend = process.env.FRONTEND_URL || "http://localhost:5173";
      
      // Exact match to configured frontend
      if (origin === allowedFrontend) {
        return callback(null, true);
      }
      
      // Allow ALL Vercel deployments (preview, production, any subdomain)
      // This includes: sunlms.vercel.app, udrive-lms.vercel.app, project-name-*.vercel.app, etc.
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      
      // Also allow Vercel preview URLs with git branch names (e.g., sunlms-git-main-*.vercel.app)
      if (/^https:\/\/.*-git-.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      
      // Temporary: explicitly allow legacy domain during transition
      if (origin === 'https://udrive-lms.vercel.app' || origin === 'https://sunlms.vercel.app') {
        return callback(null, true);
      }
      
      // In development, allow localhost
      if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      
      // Allow custom domains and all their subdomains (same logic as Express CORS)
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
          // Security: Escape backslashes first, then dots to prevent regex injection
          const escapedDomain = domain.replace(/\\/g, '\\\\').replace(/\./g, '\\.');
          const domainPattern = new RegExp(`^https?:\\/\\/.*${escapedDomain}$`);
          if (domainPattern.test(origin)) {
            return callback(null, true);
          }
        }
      }
      
      // Silent CORS rejection - no logging to reduce noise
      return callback(new Error('Not allowed by Socket.IO CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type"]
  }
});

// Store io instance in app for use in routes
app.set('io', io);

// Add basic socket server logging - MINIMAL for now
// console.log('🔌 [SOCKET-SERVER] Socket.IO server initialized');
// console.log('🔌 [SOCKET-SERVER] CORS origin:', process.env.FRONTEND_URL || "http://localhost:5173", '(plus *.vercel.app, legacy udrive-lms allowed)');

// Socket.IO authentication and connection handling
// TEMPORARILY DISABLED VERBOSE LOGGING - will re-enable after SCORM testing
io.use(async (socket, next) => {
  try {
    let token = socket.handshake.auth && socket.handshake.auth.token;
    
    // Fallback: read from cookie if not provided in auth payload
    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = {};
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          if (name && rest.length > 0) {
            cookies[name.trim()] = rest.join('=').trim();
          }
        });
      }
      token = cookies.auth_token;
    }
    
    // Also check Authorization header as fallback
    if (!token) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Additional fallback: check if token is in query parameters
    if (!token) {
      const queryToken = socket.handshake.query?.token;
      if (queryToken) {
        token = queryToken;
      }
    }
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const jwt = await import('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.default.verify(token, APP_CONFIG.JWT_SECRET);
    } catch (jwtError) {
      throw jwtError;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return next(new Error('Authentication error: Token expired'));
    }
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, role, tenant_id FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }

    const user = result.rows[0];
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.tenantId = decoded.tenant_id;
    next();
  } catch (error) {
    // Silent fail - no logging to reduce noise
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join user-specific room
  socket.join(`user_${socket.userId}`);
  
  // Join tenant-specific room if applicable
  if (socket.tenantId) {
    socket.join(`tenant_${socket.tenantId}`);
  }
  
  // Join role-specific room
  socket.join(`role_${socket.userRole}`);
  
  socket.on('disconnect', (reason) => {
    // Silent disconnect - no logging to reduce noise
  });
});

// Add connection attempt logging - DISABLED
// io.engine.on('connection_error', (err) => {
//   console.error('❌ [SOCKET-ENGINE-ERROR] Connection error:', err);
// });

// Log when socket server is ready - DISABLED
// io.on('connect', () => {
//   console.log('🔌 [SOCKET-SERVER] Socket server is ready for connections');
// });

// Rate limiters
const scormContentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (SCORM content can have many files)
  message: 'Too many requests for SCORM content, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const scormApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many SCORM API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors(APP_CONFIG.CORS_OPTIONS));
app.use(express.json({ limit: '10mb' })); // Increase limit for lesson content with images
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Debug: Log all requests to help diagnose routing issues
if (process.env.VERCEL) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/scorm/content')) {
      console.log('[DEBUG] Request to SCORM content:', {
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
      });
    }
    next();
  });
}

// SCORM content streaming (same-origin, path-style URLs)
// Example:
//   /api/scorm/content/<packageId>/Playing/Playing.html
//   /api/scorm/content/<packageId>/static/js/main.js
// Use app.use with path prefix - this should work in both local and Vercel
app.use(
  '/api/scorm/content',
  scormContentLimiter, // Rate limiting to prevent abuse
  requireAuth,
  tenantContext,
  async (req, res, next) => {
    try {
      // Only handle GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Early return if path doesn't match (shouldn't happen, but safety check)
      if (!req.path && !req.url.startsWith('/api/scorm/content')) {
        return next();
      }

      console.log('[SCORM] Content request received:', {
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
      });

      // Parse path - handle both Vercel serverless and local Express behavior
      // In Vercel, req.path might be full path; in Express, it's relative to the route
      let pathToParse = req.path;
      
      // If path includes the full route prefix, strip it
      if (pathToParse.startsWith('/api/scorm/content')) {
        pathToParse = pathToParse.replace(/^\/api\/scorm\/content\/?/, '');
      }
      
      // Also check req.url as fallback (includes query string, but we'll strip it)
      if (!pathToParse || pathToParse === '/') {
        const urlPath = req.url.split('?')[0]; // Remove query string
        if (urlPath.startsWith('/api/scorm/content')) {
          pathToParse = urlPath.replace(/^\/api\/scorm\/content\/?/, '');
        }
      }
      
      // Also try originalUrl as another fallback
      if (!pathToParse || pathToParse === '/') {
        const originalPath = req.originalUrl.split('?')[0];
        if (originalPath.startsWith('/api/scorm/content')) {
          pathToParse = originalPath.replace(/^\/api\/scorm\/content\/?/, '');
        }
      }
      
      // Remove leading slashes and parse
      const trimmedPath = pathToParse.replace(/^\/+/, ''); // remove leading slashes
      const pathParts = trimmedPath.split('/').filter(Boolean); // filter empty strings
      
      console.log('[SCORM] Path parsing intermediate:', {
        originalPath: req.path,
        originalUrl: req.originalUrl,
        url: req.url,
        pathToParse,
        trimmedPath,
        pathParts,
      });
      
      if (pathParts.length < 2) {
        console.error('[SCORM] Invalid path structure:', {
          originalPath: req.path,
          originalUrl: req.originalUrl,
          url: req.url,
          parsedPath: pathToParse,
          pathParts,
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid SCORM content path. Expected: /api/scorm/content/<packageId>/<filePath>',
        });
      }

      const packageId = pathParts[0];
      const filePath = pathParts.slice(1).join('/');

      console.log('[SCORM] Path parsing result:', {
        originalPath: req.path,
        originalUrl: req.originalUrl,
        url: req.url,
        packageId,
        filePath,
      });

      if (!packageId) {
        return res.status(400).json({
          success: false,
          error: 'Package ID is required in SCORM content path',
        });
      }

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required in SCORM content path',
        });
      }

      // Sanitize file path
      let sanitizedPath = filePath.replace(/\.\./g, '').replace(/\0/g, '');
      sanitizedPath = sanitizedPath.replace(/^\.\//, '');
      sanitizedPath = sanitizedPath
        .replace(/\/+/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

      // Look up package info
      const pkgResult = await pool.query(
        `SELECT content_base_path, tenant_id 
         FROM public.scorm_packages 
         WHERE id = $1`,
        [packageId]
      );

      if (pkgResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SCORM package not found',
        });
      }

      const pkg = pkgResult.rows[0];

      // Tenant isolation: only allow access to content for the same tenant (unless super admin)
      if (req.user?.role !== 'super_admin' && pkg.tenant_id !== req.tenantId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to SCORM content',
        });
      }

      const contentBasePath = pkg.content_base_path;
      if (!contentBasePath || !contentBasePath.startsWith('http')) {
        return res.status(400).json({
          success: false,
          error: 'Package content is not stored in Vercel Blob',
        });
      }

      const fullUrl = `${contentBasePath.replace(/\/$/, '')}/${sanitizedPath}`;
      console.log('[SCORM] Streaming content from Blob:', fullUrl);

      const https = await import('https');
      const http = await import('http');
      const url = await import('url');

      const urlObj = new url.URL(fullUrl);
      const transport = urlObj.protocol === 'https:' ? https : http;

      transport
        .get(fullUrl, (blobRes) => {
          if (blobRes.statusCode && blobRes.statusCode >= 400) {
            console.error(
              '[SCORM] Blob responded with error:',
              blobRes.statusCode,
              blobRes.statusMessage
            );
            res.status(blobRes.statusCode).end();
            return;
          }

          const contentType = blobRes.headers['content-type'] || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

          blobRes.pipe(res);
          blobRes.on('end', () => {
            console.log('[SCORM] Finished streaming SCORM content:', fullUrl);
          });
          blobRes.on('error', (err) => {
            console.error('[SCORM] Error streaming SCORM content:', err);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                error: 'Failed to stream SCORM content',
              });
            }
          });
        })
        .on('error', (err) => {
          console.error('[SCORM] Error fetching SCORM content from Blob:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Failed to fetch SCORM content from storage',
            });
          }
        });
    } catch (err) {
      console.error('[SCORM] Unexpected error in SCORM content handler:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: err.message || 'Unexpected error serving SCORM content',
        });
      }
    }
  }
);

// Static serving for extracted SCORM content
// Serve SCORM files with proper headers and security
app.use('/scorm-content', express.static('storage/scorm', {
  setHeaders: (res, filePath) => {
    // Allow iframe embedding for SCORM content
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Don't cache SCORM content aggressively
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Request logging
if (APP_CONFIG.ENABLE_REQUEST_LOGGING) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/instructors', instructorsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/2fa', twoFactorAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings/white-label', whiteLabelRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/review-settings', reviewSettingsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/course-support', courseSupportRoutes);
app.use('/api/scorm', scormRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO test endpoint
app.get('/api/socket-test', (req, res) => {
  res.json({ 
    status: 'ok', 
    socketServer: 'running',
    timestamp: new Date().toISOString(),
    message: 'Socket.IO server is running and ready for connections'
  });
});

// Token validation test endpoint
app.get('/api/test-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.auth_token;
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, APP_CONFIG.JWT_SECRET);
    
    res.json({
      success: true,
      decoded,
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      message: 'Token validation failed'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found' 
  });
});

// Global error handler (must be last)
app.use(errorHandler);

const startServer = async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server running on http://localhost:${APP_CONFIG.PORT}`);
  console.log(`📡 API available at http://localhost:${APP_CONFIG.PORT}/api`);
  console.log(`🔐 Auth endpoints at http://localhost:${APP_CONFIG.PORT}/api/auth`);
  console.log(`🌍 Environment: ${APP_CONFIG.NODE_ENV}`);
  console.log(`🎨 Frontend: ${APP_CONFIG.FRONTEND_URL}`);

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Server is ready! Keep this terminal open.\n');
};

if (!process.env.VERCEL) {
  server.listen(APP_CONFIG.PORT, startServer);
} else {
  console.log('⚡ Running in Vercel environment - deferring server.listen');
  startServer().catch((error) => {
    console.error('❌ Failed to initialize server in Vercel environment:', error);
  });
}

const handler = (req, res) => {
  server.emit('request', req, res);
};

export default handler;
export { app };

