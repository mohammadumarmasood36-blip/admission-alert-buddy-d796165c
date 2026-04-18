import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const publicBackendUrl = process.env.VITE_SUPABASE_URL ?? "https://xtavgmwgwmedqutlrvsr.supabase.co";
const publicBackendAnonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YXZnbXdnd21lZHF1dGxydnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg2OTQsImV4cCI6MjA5MTYzNDY5NH0.o4Y-F15RhQDlAm4RiNoD9pZxVq13qgTIMFpdpZL3tS8";
const publicBackendProjectId = process.env.VITE_SUPABASE_PROJECT_ID ?? "xtavgmwgwmedqutlrvsr";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicBackendAnonKey),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(publicBackendProjectId),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
