import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
// API dev server (apps/api, docs/PLAN.md); `npm run dev` at the root starts both.
const apiProxy = { "/api": { target: "http://localhost:3001", changeOrigin: true } };

export default defineConfig(() => ({
  // Single .env at the repo root, shared with API/worker (F0-08); only VITE_* reaches the web bundle (INV-14).
  envDir: path.resolve(import.meta.dirname, "../.."),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
