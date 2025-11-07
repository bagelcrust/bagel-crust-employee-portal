/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(40px, -60px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-50px, -50px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, -70px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'translateX(-50%) scale(0.5)' },
          '50%': { opacity: '1', transform: 'translateX(-50%) scale(1.05)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) scale(1)' },
        },
        'float-very-slow': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(40px, -50px)' },
        },
        'float-slower': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-45px, 35px)' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 8s ease-in-out infinite',
        'float-delayed': 'float-delayed 10s ease-in-out infinite',
        'float-slow': 'float-slow 12s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'bounce-in': 'bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'float-very-slow': 'float-very-slow 20s ease-in-out infinite',
        'float-slower': 'float-slower 25s ease-in-out infinite',
      },
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