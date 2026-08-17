import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 select-none overflow-hidden',
  {
    variants: {
      variant: {
        primary:   'gradient-btn',
        secondary: 'bg-surface border border-border text-text2 hover:bg-surface3 hover:border-borderStrong hover:text-text shadow-sm',
        outline:   'bg-transparent border border-border text-text2 hover:bg-surface3 hover:text-text hover:border-borderStrong',
        ghost:     'text-text2 hover:bg-surface3 hover:text-text',
        danger:    'bg-danger text-white hover:bg-danger/90 border border-transparent shadow-sm',
        glass:     'bg-surface border border-border text-text hover:bg-surface3 shadow-sm',
      },
      size: {
        sm:       'h-8 px-3 text-xs',
        md:       'h-10 px-4 text-sm',
        lg:       'h-11 px-5 text-sm',
        icon:     'h-9 w-9',
        'icon-sm':'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
