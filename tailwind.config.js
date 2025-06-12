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
        'whatsapp': {
          'light-green': '#DCF8C6',
          'green': '#25D366',
          'teal': '#128C7E',
          'blue': '#34B7F1',
          'dark': '#075E54'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}