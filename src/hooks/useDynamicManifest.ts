import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * DYNAMIC PWA MANIFEST HOOK
 *
 * Generates a PWA manifest dynamically based on the current page.
 * This ensures "Add to Home Screen" opens the exact page you were on:
 * - If on /clockinout → PWA opens to clock in page
 * - If on /employee-portal → PWA opens to employee portal
 * - If on /schedule-builder → PWA opens to schedule builder
 *
 * How it works:
 * 1. Detects current URL path
 * 2. Creates manifest JSON with current path as start_url
 * 3. Generates a blob URL from the manifest
 * 4. Injects/updates the manifest link in <head>
 */
export function useDynamicManifest() {
  const location = useLocation()

  useEffect(() => {
    // Get full URL including origin (required for PWA start_url)
    const fullUrl = window.location.origin + location.pathname

    console.log('📱 PWA Manifest: Generating for path:', location.pathname)
    console.log('📱 PWA Manifest: Full start_url:', fullUrl)

    // Generate manifest based on current path
    const manifest = {
      name: 'Bagel Crust Employee Portal',
      short_name: 'Bagel Crust',
      description: 'Employee scheduling, timesheets, and portal for Bagel Crust',
      start_url: fullUrl, // Full URL including origin
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2563EB',
      orientation: 'portrait',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }

    // Convert manifest to blob URL
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
    const manifestURL = URL.createObjectURL(manifestBlob)

    // Remove old manifest link if it exists
    const oldManifestLink = document.querySelector('link[rel="manifest"]')
    if (oldManifestLink) {
      oldManifestLink.remove()
    }

    // Create new manifest link
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = manifestURL
    document.head.appendChild(manifestLink)

    console.log('📱 PWA Manifest: Updated manifest link in <head>')

    // Cleanup: revoke blob URL when location changes
    return () => {
      URL.revokeObjectURL(manifestURL)
    }
  }, [location.pathname])
}
