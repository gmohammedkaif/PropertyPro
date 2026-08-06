import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-300 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: '',
        secondary: 'bg-surface2/80 backdrop-blur-sm border border-border text-text hover:bg-surface2',
        ghost: 'text-text2 hover:bg-surface2/50 hover:text-text',
        danger: 'bg-danger/90 backdrop-blur-sm border border-danger/30 text-white hover:bg-danger',
        glass: 'glass text-text',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
