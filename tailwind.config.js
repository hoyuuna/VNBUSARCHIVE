/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./_core.html",               // File chính ở thư mục gốc
    "./public/**/*.html",         // Tất cả file html trong public và thư mục con (status, hbds-map...)
    "./public/**/*.js",           // Tất cả file js trong public
    "./api/**/*.js",              // Các script trong thư mục api
    "./*.js",                     // Các file js ở thư mục gốc (token.js...)
    "./src/**/*.js",              // Các file js trong thư mục src
    "./src/**/*.html"             // Các file html trong thư mục src
  ],
  darkMode: ['class', '.theme-dark'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        logo: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        watermark: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        'vbs-dark': '#09090b',
        'vbs-blue': '#18181b',
        'vbs-gray': '#f4f4f5',
        'vbs-border': '#e4e4e7',
        'vbs-hover': '#27272a',
      },
      boxShadow: {
        'island': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
      }
    }
  },
  plugins: [],
}