import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: { port: 5201, strictPort: true, proxy: { "/api": apiTarget } },
  preview: { port: 5201, strictPort: true, proxy: { "/api": apiTarget } },
});
