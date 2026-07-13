import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-page)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        primary: {
          DEFAULT: '#0084FF',
          50: 'rgba(0, 132, 255, 0.05)',
          100: 'rgba(0, 132, 255, 0.10)',
          200: 'rgba(0, 132, 255, 0.20)',
          300: 'rgba(0, 132, 255, 0.30)',
          400: 'rgba(0, 132, 255, 0.50)',
          500: '#0084FF',
          600: '#0074E0',
          700: '#0064C0',
        },
        sky: {
          DEFAULT: '#60B1FF',
          400: '#60B1FF',
        },
        purple: {
          DEFAULT: '#7C3AED',
          400: '#A78BFA',
          600: '#7C3AED',
        },
        pink: {
          DEFAULT: '#FF518D',
          400: '#FF7AA9',
        },
        orange: {
          DEFAULT: '#FF8A02',
          400: '#FFA43A',
        },
        mint: {
          DEFAULT: '#4FFFB0',
          400: '#4FFFB0',
        },
        violet: {
          DEFAULT: '#7B61FF',
          400: '#9E8BFF',
        },
        dark: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        border: 'var(--border-color)',
        success: '#4FFFB0',
        warning: '#F59E0B',
        error: '#EF4444',
        'soft-blue': 'rgba(0, 132, 255, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fustat', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 4px 30px rgba(0, 0, 0, 0.4)',
        'card-md': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'card-lg': '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 132, 255, 0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
