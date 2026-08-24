/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          900: '#090b0e',
          800: '#0e1116',
          700: '#12161c',
          600: '#171c23',
        },
        steel: {
          DEFAULT: '#7d93ab',
          dim: '#52657a',
          bright: '#9fb3c8',
        },
        accent: {
          green: '#4ade80',
          yellow: '#facc15',
          red: '#f87171',
          blue: '#60a5fa',
          cyan: '#22d3ee',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
