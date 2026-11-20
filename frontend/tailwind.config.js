/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',      // Primary Navy Blue
          royal: '#1E40AF',     // Secondary Royal Blue
          light: '#F8FAFC',     // Light Background
          accent: '#06B6D4',    // Cyan Accent
          border: '#E2E8F0',
        }
      }
    },
  },
  plugins: [],
}
