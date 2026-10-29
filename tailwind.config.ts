import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#faf9f6',
          surface: '#ffffff',
          subtle: '#f5f3ef',
          border: '#e7e5e4',
          peach: '#fff7ed',
          coral: '#f97316',
          coralDark: '#c2410c',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-jakarta)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(28, 25, 23, 0.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'sheet-down': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 200ms ease-in forwards',
        'sheet-up': 'sheet-up 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'sheet-down': 'sheet-down 200ms ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
