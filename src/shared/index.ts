/**
 * Shared React hooks for Bagel Crust
 *
 * These are GLOBAL hooks used across multiple features.
 * Feature-specific hooks should live in their feature folders.
 */

// PWA dynamic manifest hook (used in App.tsx)
export { useDynamicManifest } from './useDynamicManifest'

// Shadcn UI toast hook (used by ui/toaster.tsx)
export { useToast } from './use-toast'
