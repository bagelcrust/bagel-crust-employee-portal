/**
 * GlassCard - Reusable glassmorphism card component
 * Uses Tailwind CSS for styling
 */

import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

/**
 * Glassmorphism card with subtle transparency and blur effect
 * Provides consistent styling across the Employee Portal
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 ${className}`}>
      {children}
    </div>
  )
}
