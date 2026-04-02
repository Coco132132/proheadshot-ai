/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#E8D5A3',
          DEFAULT: '#C9A96E',
          dark: '#9A7B4F',
        },
        charcoal: {
          900: '#0F0F0F',
          800: '#161616',
          700: '#1E1E1E',
          600: '#2A2A2A',
          500: '#3A3A3A',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #9A7B4F 0%, #C9A96E 40%, #E8D5A3 70%, #C9A96E 100%)',
      },
    },
  },
  plugins: [],
}
