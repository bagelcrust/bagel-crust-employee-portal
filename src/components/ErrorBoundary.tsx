import { Component, ReactNode } from 'react'

/**
 * ERROR BOUNDARY COMPONENT
 *
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 * Features:
 * - Graceful error handling
 * - User-friendly error message
 * - Reload button for recovery
 * - Consistent with app styling (glass morphism)
 *
 * Usage: Wrap App component in main.tsx
 */

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    // In production, you could send this to an error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-white/80 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try reloading the page.
            </p>

            {/* Error Details (Dev Only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
