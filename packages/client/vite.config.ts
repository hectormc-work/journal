import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    // CSS, not JS — the dep optimizer misidentifies it as an incompatible
    // pre-bundle candidate otherwise.
    exclude: ["@journal/ui-common/styles"],
  },
  server: {
    proxy: {
      // Same-origin in dev: the client calls /api/*, Vite forwards to Hono.
      "/api": "http://localhost:3000",
    },
  },
});
