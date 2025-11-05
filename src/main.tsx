import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

/**
 * REACT QUERY CONFIGURATION
 *
 * Optimized for production with:
 * - Network-aware queries (refetch on reconnect)
 * - Proper garbage collection (5 min)
 * - Automatic retries for failed queries
 * - Dev tools (development only)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: true, // Refetch when user returns to app
      refetchOnReconnect: true, // Auto-refetch on network reconnect
      staleTime: 60 * 1000, // Data is fresh for 1 minute by default
      gcTime: 5 * 60 * 1000, // 5 min garbage collection
      networkMode: 'online', // Don't try queries when offline
    },
    mutations: {
      retry: 0, // Don't retry mutations
      networkMode: 'online',
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* React Query DevTools - Development Only */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
