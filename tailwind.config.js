/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./public/**/*.html",
    "./public/**/*.js",
    "./api/**/*.js",
    "./*.js",
    "./_core.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
        logo: ['"Montserrat"', 'sans-serif'],
        watermark: ['"Montserrat"', 'sans-serif'],
      },
      colors: {
        primary: "#171717",
        secondary: "#4d4d4d",
        tertiary: "#006bff",
        neutral: "#f2f2f2",
        'background-100': "#ffffff",
        'background-200': "#fafafa",
        gray: {
          100: "#f2f2f2",
          200: "#ebebeb",
          300: "#e6e6e6",
          400: "#eaeaea",
          500: "#c9c9c9",
          600: "#a8a8a8",
          700: "#8f8f8f",
          800: "#7d7d7d",
          900: "#4d4d4d",
          1000: "#171717",
        },
        blue: {
          100: "#f0f7ff",
          200: "#e9f4ff",
          300: "#dfefff",
          400: "#cae7ff",
          500: "#94ccff",
          600: "#48aeff",
          700: "#006bff",
          800: "#0059ec",
          900: "#005ff2",
          1000: "#002359",
        },
        red: {
          100: "#ffeeef",
          200: "#ffe8ea",
          300: "#ffe3e4",
          400: "#ffd7d6",
          500: "#ffb1b3",
          600: "#ff676d",
          700: "#fc0035",
          800: "#ea001d",
          900: "#d8001b",
          1000: "#47000c",
        },
        amber: {
          100: "#fff6de",
          200: "#fff4cf",
          300: "#fff1c1",
          400: "#ffdc73",
          500: "#ffc543",
          600: "#ffa600",
          700: "#ffae00",
          800: "#ff9300",
          900: "#aa4d00",
          1000: "#561900",
        },
        // Old VBS colors mapped to Geist
        'vbs-dark': '#171717',
        'vbs-blue': '#171717',
        'vbs-gray': '#fafafa',
        'vbs-border': '#eaeaea',
        'vbs-hover': '#ebebeb',
      },
      boxShadow: {
        'island': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'geist-raised': '0 2px 2px rgba(0, 0, 0, 0.04)',
        'geist-popover': '0 1px 1px rgba(0, 0, 0, 0.02), 0 4px 8px -4px rgba(0, 0, 0, 0.04), 0 16px 24px -8px rgba(0, 0, 0, 0.06)',
        'geist-modal': '0 1px 1px rgba(0, 0, 0, 0.02), 0 8px 16px -4px rgba(0, 0, 0, 0.04), 0 24px 32px -8px rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '16px',
        'full': '9999px',
      }
    }
  },
  plugins: [],
}