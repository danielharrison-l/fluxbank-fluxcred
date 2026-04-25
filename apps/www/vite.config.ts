import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 3001),
  },
  preview: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 3001),
  },
});
