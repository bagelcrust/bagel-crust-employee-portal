import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedDigitProps {
  value: string
  className?: string
}

/**
 * Animated digit component that flips when the value changes
 * Uses Framer Motion for smooth flip animation
 */
export function AnimatedDigit({ value, className = '' }: AnimatedDigitProps) {
  return (
    <div className={`relative inline-block overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
