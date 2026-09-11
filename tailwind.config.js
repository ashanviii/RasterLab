/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#8b7ff5',
          50: '#f4f2fe',
          100: '#ebe8fd',
          200: '#d8d2fb',
          300: '#bcb0f7',
          400: '#9c88f2',
          500: '#8b7ff5',
          600: '#6f5ce8',
          700: '#5d47cf',
          800: '#4c3aa8',
          900: '#403285',
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
