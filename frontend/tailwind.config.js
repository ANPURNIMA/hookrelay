/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: { 950: '#0d1117', 900: '#0f141c', 800: '#161b22', 700: '#21262d', 600: '#30363d' },
        ink: { 50: '#f0f6fc', 200: '#c9d1d9', 400: '#8b949e', 500: '#6e7681' },
        signal: { blue: '#38bdf8', green: '#2ea043', amber: '#d97706', red: '#da3633' },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
