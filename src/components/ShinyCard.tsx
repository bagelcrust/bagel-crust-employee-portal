import { ReactNode } from 'react'

interface ShinyCardProps {
  children: ReactNode
  className?: string
}

/**
 * Card component with animated shine border effect
 * Creates a subtle shimmer that travels around the border
 */
export function ShinyCard({ children, className = '' }: ShinyCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[10px]">
      {/* Animated shine border */}
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent)',
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true"
      >
        <div className="w-full h-full animate-border-shine" />
      </div>

      {/* Card content */}
      <div className={`relative ${className}`}>
        {children}
      </div>
    </div>
  )
}
