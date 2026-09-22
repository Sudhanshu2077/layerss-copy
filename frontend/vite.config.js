import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2019",
  },
  server: {
    port: 5173,
    proxy: {
      // Local dev: Vite serves frontend, Express backend serves /api on :4000.
      // Production: VITE_API_URL points at the Render backend instead.
      "/api": process.env.BACKEND_URL || "http://localhost:4000",
    },
  },
  preview: {
    port: 4173,
  },
});
