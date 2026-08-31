import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './_pages/**/*.html',
    './_pages/**/*.adoc',
    './_standards/**/*.adoc',
    './_projects/**/*.adoc',
    './_posts/**/*.md',
    './_groups/**/*.adoc',
    './_members/**/*.adoc',
    './_procedures/**/*.adoc',
    './index.adoc',
    './_frontend/**/*.{js,ts,vue}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        primary: {
          50: '#e6f0fa',
          100: '#cce0f5',
          200: '#99c2eb',
          300: '#66a3e0',
          400: '#3385d6',
          500: '#0061ad',
          600: '#005090',
          700: '#003f73',
          800: '#002e56',
          900: '#001d39',
        },
      },
    },
  },
  plugins: [
    typography,
  ],
}
