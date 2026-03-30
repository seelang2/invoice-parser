import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],

  // Added this from guide though it's working without it, so default server?
  server: {
    port: 5173, // default; change if needed
    open: true, // open browser on dev server start
    proxy: {
      // Proxy /api requests to your backend during development
      // Avoids CORS issues when frontend and backend are on different ports
      "/api": {
        target: "http://localhost:80",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // strip prefix if needed
      },
    },
  },
});
