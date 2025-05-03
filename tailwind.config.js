/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50: '#F5F5FF',
          100: '#EBEBFF',
          200: '#D8D7FF',
          300: '#C5C2FF',
          400: '#B1ADFF',
          500: '#9E99FF',
          600: '#7B75E8',
          700: '#4F46E5',
          800: '#3730A3',
          900: '#231E81',
        },
      },
    },
  },
  plugins: [],
}; 