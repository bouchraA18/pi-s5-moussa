/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f9fd",
          100: "#e5f2fa",
          200: "#c5e2f4",
          300: "#94cbeb",
          400: "#5caedc",
          500: "#3490c6",
          600: "#004e7c",
          700: "#004067",
          800: "#003554",
          900: "#002e47",
          950: "#001e30"
        },
        accent: {
          500: "#f97316",
          600: "#ea580c"
        },
        form: {
          bg: "#0c4a6e",
          field: "#336b8a",
          border: "#4a8fb3"
        }
      }
    }
  },
  plugins: []
};
