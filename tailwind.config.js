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
        sans: ['"Be Vietnam Pro"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        logo: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        watermark: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Montserrat"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        'vbs-dark': '#111315',
        'vbs-blue': '#191c20',
        'vbs-gray': '#f0f2f5',
        'vbs-border': '#e1e5ea',
        'vbs-hover': '#272a2f',
        // M3 Monochromatic Neutral Surface Tokens
        m3: {
          surface: 'var(--md-sys-color-surface, #f8f9fa)',
          'surface-dim': 'var(--md-sys-color-surface-dim, #d8dadc)',
          'surface-bright': 'var(--md-sys-color-surface-bright, #f8f9fa)',
          'container-lowest': 'var(--md-sys-color-surface-container-lowest, #ffffff)',
          'container-low': 'var(--md-sys-color-surface-container-low, #f0f2f5)',
          container: 'var(--md-sys-color-surface-container, #e9edf1)',
          'container-high': 'var(--md-sys-color-surface-container-high, #e1e5ea)',
          'container-highest': 'var(--md-sys-color-surface-container-highest, #d8dde3)',
          'on-surface': 'var(--md-sys-color-on-surface, #191c20)',
          'on-surface-variant': 'var(--md-sys-color-on-surface-variant, #50555e)',
          outline: 'var(--md-sys-color-outline, #74777f)',
          'outline-variant': 'var(--md-sys-color-outline-variant, #c4c7cf)',
          primary: 'var(--md-sys-color-primary, #191c20)',
          'on-primary': 'var(--md-sys-color-on-primary, #ffffff)',
        }
      },
      borderRadius: {
        'm3-card': '20px',
        'm3-dialog': '28px',
        'm3-sheet': '28px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'island': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'm3-1': '0 1px 3px 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'm3-2': '0 3px 8px 2px rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'm3-3': '0 6px 16px 4px rgba(0, 0, 0, 0.07), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'm3-4': '0 10px 24px 6px rgba(0, 0, 0, 0.08), 0 4px 8px 0 rgba(0, 0, 0, 0.04)',
        'm3-5': '0 16px 36px 8px rgba(0, 0, 0, 0.10), 0 6px 12px 0 rgba(0, 0, 0, 0.05)',
      }
    }
  },
  plugins: [],
}
