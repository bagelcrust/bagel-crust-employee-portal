/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		keyframes: {
  			'gradient-shift': {
  				'0%, 100%': {
  					backgroundPosition: '0% 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'50%': {
  					transform: 'translate(40px, -60px)'
  				}
  			},
  			'float-delayed': {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'50%': {
  					transform: 'translate(-50px, -50px)'
  				}
  			},
  			'float-slow': {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'50%': {
  					transform: 'translate(30px, -70px)'
  				}
  			},
  			'pulse-subtle': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.8'
  				}
  			},
  			'fade-in-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'bounce-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-50%) scale(0.5)'
  				},
  				'50%': {
  					opacity: '1',
  					transform: 'translateX(-50%) scale(1.05)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(-50%) scale(1)'
  				}
  			},
  			'float-very-slow': {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'50%': {
  					transform: 'translate(40px, -50px)'
  				}
  			},
  			'float-slower': {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'50%': {
  					transform: 'translate(-45px, 35px)'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'gradient-shift': 'gradient-shift 8s ease infinite',
  			float: 'float 8s ease-in-out infinite',
  			'float-delayed': 'float-delayed 10s ease-in-out infinite',
  			'float-slow': 'float-slow 12s ease-in-out infinite',
  			'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
  			'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
  			'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
  			'bounce-in': 'bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
  			'float-very-slow': 'float-very-slow 20s ease-in-out infinite',
  			'float-slower': 'float-slower 25s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		colors: {
  			'hub-background': '#F2F2F7',
  			'hub-card': '#FFFFFF',
  			'hub-card-secondary': '#F9F9FB',
  			'hub-text-primary': '#1D1D1F',
  			'hub-text-secondary': '#6E6E73',
  			'hub-text-tertiary': '#8E8E93',
  			'hub-accent': {
  				primary: '#007AFF',
  				green: '#34C759',
  				orange: '#FF9500',
  				purple: '#AF52DE'
  			},
  			'hub-surface': {
  				elevated: '#FFFFFF',
  				base: '#F2F2F7',
  				secondary: '#E5E5EA'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}