import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface-2)',
        surface3: 'var(--color-surface-3)',
        surface4: 'var(--color-surface-4)',
        border: 'var(--color-border)',
        borderStrong: 'var(--color-border-strong)',
        text: 'var(--color-text)',
        text2: 'var(--color-text-2)',
        muted: 'var(--color-text-muted)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          strong: 'var(--color-primary-strong)',
          soft: 'var(--color-primary-soft)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          glow: 'var(--color-secondary-glow)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          glow: 'var(--color-accent-glow)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
          glow: 'var(--color-success-glow)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
          glow: 'var(--color-warning-glow)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
          glow: 'var(--color-danger-glow)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },
        focus: 'var(--color-focus)',
        /* Ocean Palette statics */
        'pp-teal':    '#2F7F82',
        'pp-teal-lt': '#3E9295',
        'pp-seafoam': '#A9D8D5',
        'pp-ice':     '#C7DCE8',
        'pp-powder':  '#B7C7D6',
        'pp-ocean':   '#0A2638',
        'pp-nato':    '#193347',
        'pp-charcoal':'#17212B',
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        'primary': 'var(--shadow-primary)',
        'secondary': 'var(--shadow-secondary)',
        'success': 'var(--shadow-success)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'btn-shimmer': {
          '0%': { transform: 'translateX(-150%) skewX(12deg)' },
          '100%': { transform: 'translateX(150%) skewX(12deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(47, 127, 130, 0.28)' },
          '50%': { boxShadow: '0 0 40px rgba(47, 127, 130, 0.52)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'btn-shimmer': 'btn-shimmer 2s infinite linear',
        float: 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        glow: 'glow-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
