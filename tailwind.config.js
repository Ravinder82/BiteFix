/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:        '#E8820C',   // Warm Amber
        'primary-light': '#F5A623',   // Light Amber
        'primary-dark':  '#C06A00',   // Deep Amber
        secondary:      '#F5A623',   // Glowing Gold
      },
    },
  },
  plugins: [],
};
