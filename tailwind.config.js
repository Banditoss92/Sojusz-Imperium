/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'gold': {
          500: '#FFD700',
        }
      },
      backgroundImage: {
        'ancient-pattern': "url('https://images.unsplash.com/photo-1588421357574-87938a86fa28?auto=format&fit=crop&q=80')",
      }
    },
  },
  plugins: [],
};