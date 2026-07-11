import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Same-origin in dev: the client calls /api/*, Vite forwards to Hono.
      "/api": "http://localhost:3000",
    },
  },
});
