import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", // backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
