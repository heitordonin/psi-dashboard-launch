
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: {
      origin: [
        "https://lovable.dev",
        "https://lovableproject.com",
        /\.lovable\.dev$/,
        /\.lovableproject\.com$/
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
    },
    hmr: {
      clientPort: 443,
      host: "localhost"
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger({
      // Configure component tagger for Lovable environment
      enabled: true,
      tagPrefix: 'lovable',
      showBoundingBoxes: false
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Ensure proper environment variables
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
}));
