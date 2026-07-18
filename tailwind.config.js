/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#effdf5',
          100: '#d9fbe8',
          200: '#b7f5d3',
          300: '#7eebb5',
          400: '#3dd98e',
          500: '#16c172',
          600: '#0ca45d',
          700: '#0d814d',
          800: '#0f663f',
          900: '#0d5436',
          950: '#062f20',
        },
        leaf: '#8cc63f',
        ink: '#0f172a',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        rise: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        rise: 'rise 650ms ease-out both',
      },
    },
  },
  plugins: [],
};
