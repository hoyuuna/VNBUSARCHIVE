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
        heading: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        'vbs-dark': '#101418',
        'vbs-blue': '#006399',
        'vbs-gray': '#f2f4fb',
        'vbs-border': '#c2c7cf',
        'vbs-hover': '#e2e7f3',
        // Material 3 Expressive (Ocean Blue)
        'm3-primary': '#006399',
        'm3-on-primary': '#ffffff',
        'm3-primary-container': '#cde5ff',
        'm3-on-primary-container': '#001d32',
        'm3-secondary': '#51606f',
        'm3-secondary-container': '#d4e4f6',
        'm3-on-secondary-container': '#0d1d2a',
        'm3-tertiary': '#65587b',
        'm3-tertiary-container': '#ebddff',
        'm3-surface': '#f8f9ff',
        'm3-on-surface': '#191c20',
        'm3-surface-container': '#eceef5',
        'm3-surface-container-high': '#e6e8ef',
        'm3-surface-container-highest': '#e0e2e9',
        'm3-outline': '#72777f',
        'm3-outline-variant': '#c2c7cf',
        // M3 Dark Tokens
        'm3-dark-primary': '#94ccff',
        'm3-dark-on-primary': '#003352',
        'm3-dark-primary-container': '#004b74',
        'm3-dark-on-primary-container': '#cde5ff',
        'm3-dark-secondary': '#b8c8da',
        'm3-dark-secondary-container': '#394957',
        'm3-dark-surface': '#101418',
        'm3-dark-surface-container': '#1d2024',
        'm3-dark-surface-container-high': '#272b2f',
        'm3-dark-outline-variant': '#42474e',
      },
      boxShadow: {
        'island': '0 2px 14px -2px rgba(0, 99, 153, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'm3-1': '0 1px 3px 1px rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
        'm3-2': '0 2px 6px 2px rgba(0, 0, 0, 0.10), 0 1px 2px 0 rgba(0, 0, 0, 0.14)',
        'm3-3': '0 4px 14px 3px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.16)',
        'm3-4': '0 6px 20px 4px rgba(0, 0, 0, 0.14), 0 2px 4px 0 rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      }
    }
  },
  plugins: [],
}
