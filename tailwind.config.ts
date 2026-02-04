import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b0f',
        mist: '#f5f3ef',
        ember: '#ff6b3d',
        glow: '#ffe29a'
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 20px 60px rgba(15, 15, 30, 0.15)'
      }
    }
  },
  plugins: []
} satisfies Config;
