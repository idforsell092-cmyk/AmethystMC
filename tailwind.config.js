/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          950: '#0f0716',
          900: '#1a0b2e',
          800: '#2b1055',
          600: '#7c3aed',
          500: '#8b5cf6',
          400: '#a78bfa',
        }
      }
    },
  },
  plugins: [],
}

