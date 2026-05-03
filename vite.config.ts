import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";
import prerender from "vite-plugin-prerender";

// ✅ FIX for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),

    prerender({
      staticDir: path.resolve(__dirname, "dist"),
      routes: ["/"],
    }),

    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2015",
  },
}));