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
    },
  },
  plugins: [],
};

export default config;
