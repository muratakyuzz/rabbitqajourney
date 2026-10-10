import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
// API dev server (apps/api, docs/PLAN.md); `npm run dev` at the root starts both. The API listens on
// 127.0.0.1 (API_HOST / API_PORT); "localhost" may resolve to ::1 first, so the target is the address itself.
const apiHost = process.env.API_HOST || "127.0.0.1";
const apiProxy = {
  "/api": { target: `http://${apiHost.includes(":") ? `[${apiHost}]` : apiHost}:${process.env.API_PORT ?? 3001}`, changeOrigin: true },
};

export default defineConfig(() => ({
  // Single .env at the repo root, shared with API/worker (F0-08); only VITE_* reaches the web bundle (INV-14).
  envDir: path.resolve(import.meta.dirname, "../.."),
  // Faz 1 has no login: dev and preview stay on this machine (docs/reviews/faz1-review.md, Y2)
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: apiProxy,
  },
  preview: {
    host: "localhost",
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
