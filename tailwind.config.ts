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
          DEFAULT: '#F97316',
          50: 'rgba(249, 115, 22, 0.05)',
          100: 'rgba(249, 115, 22, 0.10)',
          200: 'rgba(249, 115, 22, 0.20)',
          300: 'rgba(249, 115, 22, 0.30)',
          400: 'rgba(249, 115, 22, 0.50)',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        sky: {
          DEFAULT: '#FB923C',
          400: '#FB923C',
        },
        purple: {
          DEFAULT: '#EA580C',
          400: '#FDBA74',
          600: '#EA580C',
        },
        pink: {
          DEFAULT: '#FB923C',
          400: '#FDBA74',
        },
        orange: {
          DEFAULT: '#F97316',
          400: '#FB923C',
        },
        mint: {
          DEFAULT: '#F97316',
          400: '#FDBA74',
        },
        violet: {
          DEFAULT: '#EA580C',
          400: '#FDBA74',
        },
        dark: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        border: 'var(--border-color)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        'soft-blue': 'rgba(249, 115, 22, 0.06)',

        /* ── Dashboard theme ────────────────────────────────────────────
           Resolved from CSS variables on the app shell, so the same class
           names serve both the dark and the light appearance. The channel
           syntax keeps Tailwind's opacity modifiers working (bg-accent/20).
           Values live in index.css under .fc-app and .fc-app[data-theme]. */
        ink: {
          DEFAULT: 'rgb(var(--a-ink) / <alpha-value>)',
          soft:    'rgb(var(--a-ink-soft) / <alpha-value>)',
          mute:    'rgb(var(--a-ink-mute) / <alpha-value>)',
          faint:   'rgb(var(--a-ink-faint) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--a-line) / <alpha-value>)',
          soft:    'rgb(var(--a-line-soft) / <alpha-value>)',
          strong:  'rgb(var(--a-line-strong) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--a-surface) / <alpha-value>)',
          soft:    'rgb(var(--a-surface-soft) / <alpha-value>)',
          mute:    'rgb(var(--a-surface-mute) / <alpha-value>)',
          sunk:    'rgb(var(--a-surface-sunk) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--a-accent) / <alpha-value>)',
          soft:    'rgb(var(--a-accent-soft) / <alpha-value>)',
          deep:    'rgb(var(--a-accent-deep) / <alpha-value>)',
          tint:    'rgb(var(--a-accent-tint) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Mono', 'monospace'],
        silkscreen: ['Silkscreen', 'monospace'],
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
        /* Dashboard elevation — defined per appearance in index.css */
        soft:      'var(--a-shadow)',
        'soft-md': 'var(--a-shadow-md)',
        'soft-lg': 'var(--a-shadow-lg)',
        pill:      'var(--a-shadow-pill)',
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
