import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild", // Use esbuild (Vite default) for faster builds
    // Optimize chunk size for better loading performance
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: (id) => {
          // Separate Phaser into its own chunk (large library)
          if (id.includes('phaser')) {
            return 'phaser';
          }
          // Separate React vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
          }
          // Separate UI component libraries
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          // Separate Supabase and API clients
          if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
            return 'api-vendor';
          }
        },
        // Optimize asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Enable compression reporting
    reportCompressedSize: true,
    // Target modern browsers for smaller bundle size
    target: 'esnext',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['phaser', 'react', 'react-dom', 'react-router-dom'],
  },
}));
