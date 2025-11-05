import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * DYNAMIC PWA MANIFEST HOOK
 *
 * Swaps between different static manifest files based on the current page.
 * This ensures "Add to Home Screen" opens the exact page you were on:
 * - If on /clockinout → Uses manifest-clockinout.json → PWA opens to /clockinout
 * - If on /employee-portal → Uses manifest-employee-portal.json → PWA opens to /employee-portal
 * - If on /schedule-builder → Uses manifest-schedule-builder.json → PWA opens to /schedule-builder
 *
 * How it works:
 * 1. Detects current URL path
 * 2. Selects appropriate static manifest file
 * 3. Updates the manifest link in <head>
 *
 * Uses static manifest files (not blob URLs) for better browser compatibility and caching.
 */
export function useDynamicManifest() {
  const location = useLocation()

  useEffect(() => {
    // Map paths to manifest files
    let manifestFile = '/manifest-employee-portal.json' // default

    if (location.pathname.includes('clockinout')) {
      manifestFile = '/manifest-clockinout.json'
    } else if (location.pathname.includes('employee-portal')) {
      manifestFile = '/manifest-employee-portal.json'
    } else if (location.pathname.includes('schedule-builder')) {
      manifestFile = '/manifest-schedule-builder.json'
    }

    console.log('🔄 React: Route changed to:', location.pathname)
    console.log('🔄 React: Updating manifest to:', manifestFile)

    // Find existing manifest link
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement

    if (manifestLink) {
      // Update existing manifest link
      manifestLink.href = manifestFile
      console.log('✅ React: Updated existing manifest link')
    } else {
      // Create new one if somehow missing
      const newLink = document.createElement('link')
      newLink.rel = 'manifest'
      newLink.href = manifestFile
      document.head.appendChild(newLink)
      console.log('✅ React: Created new manifest link')
    }
  }, [location.pathname])
}
