/**
 * Browser-sync configuration
 * This allows access from external devices on the same network
 * 
 * Usage:
 * 1. Start backend: npm run server (or npm run dev:server)
 * 2. Start frontend: npm run dev:client
 * 3. Start browser-sync: npm run sync
 * 
 * Then access from external device using the network URL shown by browser-sync
 * (e.g., http://192.168.1.100:3000)
 * 
 * IMPORTANT: Set VITE_API_URL=/api in your .env file for this to work!
 */

const httpProxy = require('http-proxy-middleware');

module.exports = {
  // Proxy the Vite dev server
  proxy: {
    target: "http://localhost:5173",
    ws: true, // Enable websocket proxying for HMR
  },
  // Middleware to proxy API requests to backend (must be at root level)
  middleware: [
    // Proxy API requests to backend server - this runs BEFORE proxying to Vite
    function(req, res, next) {
      // Check if this is an API request
      if (req.url && req.url.startsWith('/api')) {
        const backendPort = process.env.PORT || 5000;
        const proxy = httpProxy.createProxyMiddleware({
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          logLevel: 'info', // Set to 'info' for debugging
          onProxyReq: (proxyReq, req, res) => {
            // Preserve original host header for proper routing
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            }
            console.log(`[BS Proxy] Proxying ${req.method} ${req.url} to http://localhost:${backendPort}${req.url}`);
          },
          onProxyRes: (proxyRes, req, res) => {
            console.log(`[BS Proxy] Response ${proxyRes.statusCode} for ${req.method} ${req.url}`);
          },
          onError: (err, req, res) => {
            console.error('[BS Proxy] Error proxying request:', err.message);
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'text/plain'
              });
              res.end('Proxy error: ' + err.message);
            }
          }
        });
        return proxy(req, res, next);
      }
      next();
    },
  ],
  // Port for browser-sync
  port: 3000,
  // Open browser automatically
  open: false,
  // Don't show the browser-sync UI overlay
  notify: false,
  // Reload on file changes
  files: ["dist/**/*", "src/**/*"],
  // Log level
  logLevel: "info",
  // Serve files from the public directory
  serveStatic: ["./public"],
};

