// Backend API Server
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io instance in app for use in routes
app.set('io', io);

// Add basic socket server logging
console.log('🔌 [SOCKET-SERVER] Socket.IO server initialized');
console.log('🔌 [SOCKET-SERVER] CORS origin:', process.env.FRONTEND_URL || "http://localhost:5173");

// Socket.IO authentication and connection handling
io.use(async (socket, next) => {
  try {
    console.log('🔐 [SOCKET-AUTH] Starting authentication process');
    console.log('🔐 [SOCKET-AUTH] Handshake auth:', socket.handshake.auth);
    console.log('🔐 [SOCKET-AUTH] Handshake headers:', {
      cookie: socket.handshake.headers.cookie,
      authorization: socket.handshake.headers.authorization,
      origin: socket.handshake.headers.origin
    });
    
    let token = socket.handshake.auth && socket.handshake.auth.token;
    console.log('🔐 [SOCKET-AUTH] Token from auth payload:', !!token);
    
    // Fallback: read from cookie if not provided in auth payload
    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie || '';
      console.log('🔐 [SOCKET-AUTH] Cookie header:', cookieHeader);
      
      // Parse cookies more robustly
      const cookies = {};
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          if (name && rest.length > 0) {
            cookies[name.trim()] = rest.join('=').trim();
          }
        });
      }
      
      console.log('🔐 [SOCKET-AUTH] Parsed cookies:', cookies);
      token = cookies.auth_token;
      console.log('🔐 [SOCKET-AUTH] Token from cookie:', !!token);
    }
    
    // Also check Authorization header as fallback
    if (!token) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔐 [SOCKET-AUTH] Token from Authorization header:', !!token);
      }
    }
    
    // Additional fallback: check if token is in query parameters (for debugging)
    if (!token) {
      const queryToken = socket.handshake.query?.token;
      if (queryToken) {
        token = queryToken;
        console.log('🔐 [SOCKET-AUTH] Token from query parameter:', !!token);
      }
    }
    
    console.log('🔐 [SOCKET-AUTH] Final token status:', !!token);
    console.log('🔐 [SOCKET-AUTH] Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.log('❌ [SOCKET-AUTH] No token provided in auth, cookies, or headers');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    console.log('🔐 [SOCKET-AUTH] Verifying JWT token...');
    console.log('🔐 [SOCKET-AUTH] JWT Secret available:', !!APP_CONFIG.JWT_SECRET);
    console.log('🔐 [SOCKET-AUTH] Token length:', token.length);
    
    const jwt = await import('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.default.verify(token, APP_CONFIG.JWT_SECRET);
      console.log('🔐 [SOCKET-AUTH] Token decoded successfully:', { 
        id: decoded.id, 
        role: decoded.role, 
        exp: decoded.exp,
        iat: decoded.iat 
      });
    } catch (jwtError) {
      console.error('🔐 [SOCKET-AUTH] JWT verification failed:', jwtError.message);
      console.error('🔐 [SOCKET-AUTH] JWT error details:', jwtError);
      throw jwtError;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('❌ [SOCKET-AUTH] Token expired:', { exp: decoded.exp, now });
      return next(new Error('Authentication error: Token expired'));
    }
    
    // Get user from database
    console.log('🔐 [SOCKET-AUTH] Fetching user from database...');
    const result = await pool.query(
      'SELECT id, email, role, tenant_id FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      console.log('❌ [SOCKET-AUTH] User not found or inactive:', decoded.id);
      return next(new Error('Authentication error: User not found'));
    }

    const user = result.rows[0];
    console.log('✅ [SOCKET-AUTH] User authenticated successfully:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.tenantId = decoded.tenant_id;
    next();
  } catch (error) {
    console.error('❌ [SOCKET-AUTH] Authentication error:', error.message);
    console.error('❌ [SOCKET-AUTH] Error details:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ [SOCKET-CONNECTION] User ${socket.userId} connected to notifications`);
  console.log(`✅ [SOCKET-CONNECTION] Socket ID: ${socket.id}`);
  console.log(`✅ [SOCKET-CONNECTION] User Role: ${socket.userRole}`);
  console.log(`✅ [SOCKET-CONNECTION] Tenant ID: ${socket.tenantId}`);
  
  // Join user-specific room
  socket.join(`user_${socket.userId}`);
  
  // Join tenant-specific room if applicable
  if (socket.tenantId) {
    socket.join(`tenant_${socket.tenantId}`);
  }
  
  // Join role-specific room
  socket.join(`role_${socket.userRole}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ [SOCKET-DISCONNECT] User ${socket.userId} disconnected: ${reason}`);
  });
});

// Add connection attempt logging
io.engine.on('connection_error', (err) => {
  console.error('❌ [SOCKET-ENGINE-ERROR] Connection error:', err);
});

// Log when socket server is ready
io.on('connect', () => {
  console.log('🔌 [SOCKET-SERVER] Socket server is ready for connections');
});

// Middleware
app.use(cors(APP_CONFIG.CORS_OPTIONS));
app.use(express.json({ limit: '10mb' })); // Increase limit for lesson content with images
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

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

