/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6effc',
          100: '#cce0f9',
          200: '#99c1f3',
          300: '#66a2ed',
          400: '#3383e7',
          500: '#0F52BA', // Primary blue
          600: '#0c42a1',
          700: '#093178',
          800: '#06214f',
          900: '#031027',
        },
        secondary: {
          50: '#e0f7f7',
          100: '#c2eeee',
          200: '#85dddd',
          300: '#47cccc',
          400: '#1dbbbb',
          500: '#00A9A5', // Secondary teal
          600: '#008784',
          700: '#006563',
          800: '#004442',
          900: '#002221',
        },
        accent: {
          50: '#fff1e0',
          100: '#ffe3c2',
          200: '#ffc785',
          300: '#ffab47',
          400: '#ff8f0a',
          500: '#FF7F00', // Accent orange
          600: '#cc6600',
          700: '#994d00',
          800: '#663300',
          900: '#331a00',
        },
        success: {
          500: '#2E8B57', // Success green
        },
        warning: {
          500: '#FFC107', // Warning amber
        },
        error: {
          500: '#DC2626', // Error red
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};