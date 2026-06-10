/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:        '#701a75',   // Deep Plum / Berry
        'primary-light': '#a21caf',
        'primary-dark':  '#4a044e',
        secondary:      '#f97316',   // Peach / Orange accent
      },
    },
  },
  plugins: [],
};
