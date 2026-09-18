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

        /* ── Dashboard light theme ──────────────────────────────────────
           Used only inside the authenticated app shell (`.fc-light`).
           Public marketing pages keep the black / orange palette above. */
        ink: {
          DEFAULT: '#0F172A',   // headings, primary text
          soft:    '#334155',   // body copy
          mute:    '#64748B',   // secondary / labels
          faint:   '#94A3B8',   // captions, disabled, icon chrome
        },
        line: {
          DEFAULT: '#E6E9EF',   // default hairline border
          soft:    '#F0F2F6',   // inner dividers
          strong:  '#D6DBE4',   // emphasised border
        },
        surface: {
          DEFAULT: '#FFFFFF',   // cards
          soft:    '#F7F8FA',   // page background
          mute:    '#F1F3F7',   // inset fills, tracks
          sunk:    '#E9ECF2',   // pressed / deep inset
        },
        accent: {
          DEFAULT: '#4F46E5',   // primary action, active state
          soft:    '#6366F1',   // hover / secondary accent
          deep:    '#4338CA',   // pressed
          tint:    '#EEF0FE',   // 8% wash behind icons
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
        /* Light-theme elevation: soft and close, never a hard drop */
        soft:      '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
        'soft-md': '0 1px 2px rgba(15,23,42,0.05), 0 12px 32px rgba(15,23,42,0.07)',
        'soft-lg': '0 2px 4px rgba(15,23,42,0.05), 0 20px 48px rgba(15,23,42,0.09)',
        pill:      '0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.06)',
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
