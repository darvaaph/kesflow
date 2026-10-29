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
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
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
        'modal-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'modal-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.96)' },
        },
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
        'fade-in': 'fade-in 250ms ease-out',
        'fade-out': 'fade-out 180ms ease-in forwards',
        'modal-in': 'modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-out': 'modal-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'sheet-up': 'sheet-up 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-down': 'sheet-down 180ms cubic-bezier(0.4, 0, 1, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
