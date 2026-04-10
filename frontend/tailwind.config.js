/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.3)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backdropBlur: {
        'liquid': '20px',
      },
      boxShadow: {
        'glass-inner': 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
        'glass-glow': '0 0 20px rgba(14, 165, 233, 0.2)',
      }
    },
  },
  plugins: [],
}
