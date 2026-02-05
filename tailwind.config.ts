import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f2eefc',
        paper: '#0c0d14',
        clay: '#161827',
        ember: '#7b5cff',
        sea: '#2c2f5d',
        sun: '#c49bff'
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 24px 60px rgba(9, 6, 20, 0.55)',
        lift: '0 12px 30px rgba(12, 8, 24, 0.45)'
      }
    }
  },
  plugins: []
} satisfies Config;
