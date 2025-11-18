import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Production-optimized Vite configuration
 * Targets: < 80MB build, < 30s load time, 30+ FPS
 */
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
    sourcemap: false, // Disable sourcemaps in production for smaller size
    minify: "esbuild", // Fast and effective minification
    cssMinify: true, // Minify CSS
    chunkSizeWarningLimit: 1000, // Warn on chunks > 1MB
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching and parallel loading
        manualChunks: (id) => {
          // Separate Phaser into its own chunk (large library ~2MB)
          if (id.includes('phaser')) {
            return 'phaser';
          }
          // Separate React vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Separate UI component libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Separate Supabase and API clients
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'api-vendor';
            }
            // Separate other large dependencies
            if (id.includes('recharts') || id.includes('ethers')) {
              return 'data-vendor';
            }
          }
        },
        // Optimize asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash:8][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash:8][extname]`;
          }
          if (/mp3|wav|ogg|m4a/i.test(ext)) {
            return `assets/audio/[name]-[hash:8][extname]`;
          }
          return `assets/[name]-[hash:8][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash:8].js',
        entryFileNames: 'assets/js/[name]-[hash:8].js',
        // Compact output for smaller files
        compact: true,
      },
      // Tree-shake unused code
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
      },
    },
    // Enable compression reporting
    reportCompressedSize: true,
    // Target modern browsers for smaller bundle size
    target: 'esnext',
    // Reduce build time
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['phaser', 'react', 'react-dom', 'react-router-dom'],
    exclude: ['@lovable-tagger'],
  },
  // Performance optimizations
  esbuild: {
    legalComments: 'none', // Remove comments
    treeShaking: true,
  },
}));

