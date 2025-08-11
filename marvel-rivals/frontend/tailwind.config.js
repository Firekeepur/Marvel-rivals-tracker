/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d8f0ff",
          200: "#b6e4ff",
          300: "#84d3ff",
          400: "#4abbff",
          500: "#169fff",
          600: "#0b7fe6",
          700: "#0963b4",
          800: "#0a4f8d",
          900: "#0a426f"
        }
      },
      boxShadow: {
        card: "0 10px 25px -10px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: [],
};
