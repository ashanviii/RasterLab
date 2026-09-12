/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6a9fe3',
          50: '#f2f7fe',
          100: '#e6eefd',
          200: '#c9defb',
          300: '#a3c7f7',
          400: '#7eaeea',
          500: '#6a9fe3',
          600: '#5484c9',
          700: '#446ba3',
          800: '#3a5883',
          900: '#334a6c',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Inter',
          'sans-serif',
        ],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.12)',
        'glass-dark': '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
