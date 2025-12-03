/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nova paleta de cores inspirada no mockup
        primary: colors.teal,
        secondary: colors.cyan,
        gray: colors.slate,
        success: colors.green,
        warning: colors.orange,
        danger: colors.red,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.875rem',
      },
      boxShadow: {
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'teal-500/50': '0 10px 15px -3px rgba(20, 184, 166, 0.5), 0 4px 6px -2px rgba(20, 184, 166, 0.5)',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};