import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bagel Crust',
        short_name: 'Bagel Crust',
        description: 'Employee scheduling, timesheets, and clock in/out system',
        theme_color: '#2563EB',
        background_color: '#FAF9F6',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Clock In/Out',
            short_name: 'Clock',
            description: 'Quick access to clock in or out',
            url: '/clockinout',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'My Schedule',
            short_name: 'Schedule',
            description: 'View your work schedule',
            url: '/employee-portal',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Cache Supabase API responses with network-first strategy
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in development for testing
      }
    }),

    // Sentry plugin for source maps upload (production only)
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Only upload source maps in production builds
      disable: process.env.NODE_ENV !== 'production',

      // Upload source maps to Sentry for better error stack traces
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules'],
      },

      // Release name (uses Vercel git commit SHA)
      release: {
        name: process.env.VITE_VERCEL_GIT_COMMIT_SHA || 'development',
      },
    })
  ],
  server: {
    port: 3010,
    host: '0.0.0.0', // Allow external connections for remote dev server
  },
  build: {
    // Optimize chunk strategy for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better browser caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
          'vendor-date': ['date-fns']
        }
      }
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    // Generate source maps for production debugging
    sourcemap: true,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  // Dependency pre-bundling optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ]
  }
})
