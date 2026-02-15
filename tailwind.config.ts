import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        persian: {
          50:  '#eef4fb',
          100: '#d5e3f5',
          200: '#adc7eb',
          300: '#7aa4db',
          400: '#4e80c7',
          500: '#3466ae',
          600: '#2a528f',
          700: '#1e3a5f',
          800: '#162c4a',
          900: '#0f1f35',
          950: '#0a1628',
        },
        turquoise: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        saffron: {
          50:  '#fdf8ef',
          100: '#f9edd5',
          200: '#f2d7a8',
          300: '#e9bc72',
          400: '#e0a04a',
          500: '#c7923e',
          600: '#b37a30',
          700: '#955f29',
          800: '#7c4d26',
          900: '#673f22',
          950: '#3a2010',
        },
        dark: {
          50:  '#f6f6f8',
          100: '#ecedf1',
          200: '#d5d7df',
          300: '#b1b5c3',
          400: '#878da1',
          500: '#686f86',
          600: '#535a6f',
          700: '#444a5b',
          800: '#3b404d',
          900: '#1a1b23',
          925: '#141519',
          950: '#0c0c10',
        },
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif',
        ],
        farsi: [
          'Vazirmatn', 'IRANSans', 'Tahoma', 'Arial', 'sans-serif',
        ],
        display: [
          'Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-gradient-light': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-light': '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glow': '0 0 20px rgba(30, 58, 95, 0.15)',
        'glow-lg': '0 0 40px rgba(30, 58, 95, 0.2)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            lineHeight: '1.85',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
