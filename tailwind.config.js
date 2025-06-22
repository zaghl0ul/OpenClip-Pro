/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic theme colors using CSS variables
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        surfaceHover: 'var(--color-surfaceHover)',
        border: 'var(--color-border)',
        borderHover: 'var(--color-borderHover)',
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primaryHover)',
        secondary: 'var(--color-secondary)',
        subtle: 'var(--color-subtle)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        gradientStart: 'var(--color-gradientStart)',
        gradientEnd: 'var(--color-gradientEnd)',
      },
      backgroundColor: {
        'surface-rgb': 'rgba(var(--color-surface-rgb), var(--tw-bg-opacity))',
        'background-rgb': 'rgba(var(--color-background-rgb), var(--tw-bg-opacity))',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur)',
      },
      backdropSaturate: {
        'glass': 'var(--glass-saturation)',
      },
      opacity: {
        'glass': 'var(--glass-opacity)',
        'glass-hover': 'var(--glass-hoverOpacity)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'edge-shift': 'subtle-edge-shift 10s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(var(--color-primary-rgb, 88, 166, 255), 0.2)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(var(--color-primary-rgb, 88, 166, 255), 0.4)' 
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}