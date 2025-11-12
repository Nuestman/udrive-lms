import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'suppress-installhook-sourcemap',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.endsWith('/installHook.js.map')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ version: 3, file: 'installHook.js', sources: [], names: [], mappings: '' }));
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    host: true, // Allow external connections (0.0.0.0)
    port: 5173,
    proxy: {
      // Proxy API requests to backend server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      // Ignore the Next.js scaffold to avoid Vite dev server interference
      ignored: ['**/sunlms-next/**'],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          editor: ['tinymce', '@tinymce/tinymce-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
