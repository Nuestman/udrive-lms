/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Map brand CSS variables to Tailwind color tokens for runtime theming
      // Note: requires CSS variables set on :root by WhiteLabelContext
      colors: {
        primary: {
          50: 'rgb(var(--brand-primary-50, 251 246 234))',
          100: 'rgb(var(--brand-primary-100, 246 235 207))',
          200: 'rgb(var(--brand-primary-200, 235 212 154))',
          300: 'rgb(var(--brand-primary-300, 223 189 101))',
          400: 'rgb(var(--brand-primary-400, 212 167 48))',
        //   500: 'var(--brand-primary, #B98C1B)',
          500: 'rgb(var(--brand-primary-500, 185 140 27))',
          600: 'rgb(var(--brand-primary-600, 145 109 21))',
          700: 'rgb(var(--brand-primary-700, 106 79 16))',
          800: 'rgb(var(--brand-primary-800, 68 50 10))',
          900: 'rgb(var(--brand-primary-900, 43 31 6))',
        },
        secondary: {
          50: 'rgb(var(--brand-secondary-50, 251 246 234))',
          100: 'rgb(var(--brand-secondary-100, 246 235 207))',
          200: 'rgb(var(--brand-secondary-200, 235 212 154))',
          300: 'rgb(var(--brand-secondary-300, 223 189 101))',
          400: 'rgb(var(--brand-secondary-400, 212 167 48))',
        //   500: 'var(--brand-secondary, #6A4F10)',
          500: 'rgb(var(--brand-secondary-500, 185 140 27))',
          600: 'rgb(var(--brand-secondary-600, 145 109 21))',
          700: 'rgb(var(--brand-secondary-700, 106 79 16))',
          800: 'rgb(var(--brand-secondary-800, 68 50 10))',
          900: 'rgb(var(--brand-secondary-900, 43 31 6))',
        },
        accent: {
          50: 'rgb(var(--brand-accent-50, 251 246 234))',
          100: 'rgb(var(--brand-accent-100, 246 235 207))',
          200: 'rgb(var(--brand-accent-200, 235 212 154))',
          300: 'rgb(var(--brand-accent-300, 223 189 101))',
          400: 'rgb(var(--brand-accent-400, 212 167 48))',
        //   500: 'var(--brand-accent, #D4A730)',
          500: 'rgb(var(--brand-accent-500, 185 140 27))',
          600: 'rgb(var(--brand-accent-600, 145 109 21))',
          700: 'rgb(var(--brand-accent-700, 106 79 16))',
          800: 'rgb(var(--brand-accent-800, 68 50 10))',
          900: 'rgb(var(--brand-accent-900, 43 31 6))',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};