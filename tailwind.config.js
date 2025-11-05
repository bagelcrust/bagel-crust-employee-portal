/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-Inspired "Hub" Theme for Bagel Crust
        'hub-background': '#F2F2F7', // iOS light background
        'hub-card': '#FFFFFF',
        'hub-card-secondary': '#F9F9FB', // Subtle card variant
        'hub-text-primary': '#1D1D1F', // Apple's dark text
        'hub-text-secondary': '#6E6E73', // Apple's secondary text
        'hub-text-tertiary': '#8E8E93', // Apple's tertiary text
        'hub-accent': {
          'primary': '#007AFF', // Main accent (Apple Blue)
          'green': '#34C759', // Apple Green
          'orange': '#FF9500', // Apple Orange
          'purple': '#AF52DE', // Apple Purple
        },
        'hub-surface': {
          'elevated': '#FFFFFF',
          'base': '#F2F2F7',
          'secondary': '#E5E5EA',
        },
      },
    },
  },
  plugins: [],
}