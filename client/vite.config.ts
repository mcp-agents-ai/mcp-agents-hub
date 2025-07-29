import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define backend API target URL that can be easily changed
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
// Define server port that can be configured via environment variable
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000', 10);

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Allow access from any IP address
    port: SERVER_PORT, // Port for the Vite server from environment variables
    proxy: {
      '/v1/mcp': {
        target: BACKEND_API_URL,
        changeOrigin: true
      },
      '/v1/hub': {
        target: BACKEND_API_URL,
        changeOrigin: true
      },
      '/v1/host': {
        target: BACKEND_API_URL,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
