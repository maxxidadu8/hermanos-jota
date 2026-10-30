import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Redirige las peticiones /api al backend de Express para evitar CORS.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
