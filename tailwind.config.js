/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./_core.html",
    "./public/**/*.html",
    "./public/**/*.js",
    "./api/**/*.js",
    "./*.js",
    "./src/**/*.js",
    "./src/**/*.html"
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
        'vbs-dark': '#121416',
        'vbs-blue': '#191c1e',
        'vbs-gray': '#f5f3ef',
        'vbs-border': '#e2e0da',
        'vbs-hover': '#282a2d',
        // M3 Semantic Colors
        'md-surface': 'var(--md-sys-color-surface)',
        'md-surface-dim': 'var(--md-sys-color-surface-dim)',
        'md-surface-bright': 'var(--md-sys-color-surface-bright)',
        'md-surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
        'md-surface-container-low': 'var(--md-sys-color-surface-container-low)',
        'md-surface-container': 'var(--md-sys-color-surface-container)',
        'md-surface-container-high': 'var(--md-sys-color-surface-container-high)',
        'md-surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
        'md-on-surface': 'var(--md-sys-color-on-surface)',
        'md-on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'md-outline': 'var(--md-sys-color-outline)',
        'md-outline-variant': 'var(--md-sys-color-outline-variant)',
        'md-primary': 'var(--md-sys-color-primary)',
        'md-on-primary': 'var(--md-sys-color-on-primary)',
        'md-primary-container': 'var(--md-sys-color-primary-container)',
        'md-on-primary-container': 'var(--md-sys-color-on-primary-container)',
        'md-secondary': 'var(--md-sys-color-secondary)',
        'md-on-secondary': 'var(--md-sys-color-on-secondary)',
        'md-secondary-container': 'var(--md-sys-color-secondary-container)',
        'md-on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
      },
      borderRadius: {
        'xs': 'var(--md-shape-xs)',
        'sm': 'var(--md-shape-sm)',
        'md': 'var(--md-shape-md)',
        'lg': 'var(--md-shape-lg)',
        'xl': 'var(--md-shape-xl)',
        'full': 'var(--md-shape-full)',
      },
      boxShadow: {
        'island': 'var(--md-elevation-2)',
        'm3-1': 'var(--md-elevation-1)',
        'm3-2': 'var(--md-elevation-2)',
        'm3-3': 'var(--md-elevation-3)',
        'm3-4': 'var(--md-elevation-4)',
      }
    }
  },
  plugins: [],
}
