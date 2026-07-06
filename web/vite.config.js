import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,

      babel: {
        plugins: [],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),

      "mapbox-gl": "maplibre-gl",
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
    port: 5173,
  },
  build: {
    sourcemap: process.env.VITE_SOURCEMAP === "true",
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom"],
          "react-router": ["react-router-dom"],

          // State management
          state: ["zustand"],

          // UI libraries - Split by usage frequency
          "radix-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
          ],
          "radix-forms": [
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
          ],
          "radix-misc": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-progress",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
          ],

          // Form libraries
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],

          // Map libraries (heavy, load separately)
          map: ["maplibre-gl", "react-map-gl"],

          // Utilities
          utils: [
            "axios",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],

          // Animation
          animation: ["framer-motion", "motion"],
        },
      },
    },
  },
});
