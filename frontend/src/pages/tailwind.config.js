/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A1A2E',
        'ivory-dark': '#F0EFEB',
        ivory: '#FAF8F5',
        border: '#EAE5E0',
        muted: '#6B6B78',
        accent: '#D94682',
        'accent-dark': '#C23A70',
        sage: '#5A8C72',
        'sage-dark': '#4F7A63',
        gold: '#E6A500',
        'gold-light': '#FFF8E6',

        // Dark theme colors
        'dark-bg': '#121212',
        'dark-card': '#1E1E1E',
        'dark-border': '#333333',
        'dark-text': '#E0E0E0',
        'dark-muted': '#888888',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.05)',
        hover: '0 8px 25px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        pill: '100px',
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};