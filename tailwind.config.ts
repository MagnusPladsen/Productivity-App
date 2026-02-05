import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#11110f',
        paper: '#f6f1e8',
        clay: '#e8dccc',
        ember: '#f45b39',
        sea: '#2f7b7b',
        sun: '#f0b429'
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 25px 60px rgba(20, 15, 10, 0.18)',
        lift: '0 12px 30px rgba(20, 15, 10, 0.15)'
      }
    }
  },
  plugins: []
} satisfies Config;
