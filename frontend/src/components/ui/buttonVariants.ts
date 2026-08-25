import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 select-none overflow-hidden isolate active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-xs hover:bg-primary-strong hover:shadow-md hover:-translate-y-0.5 border border-primary/20 active:translate-y-0',
        secondary:
          'bg-surface border border-border text-text hover:bg-surface2 hover:border-borderStrong hover:-translate-y-0.5 shadow-xs active:translate-y-0',
        outline:
          'bg-transparent border border-border text-text hover:bg-surface2 hover:border-borderStrong active:scale-[0.98]',
        ghost:
          'bg-transparent text-text2 hover:text-text hover:bg-surface2 active:scale-[0.98]',
        danger:
          'bg-danger text-white hover:bg-danger/90 border border-transparent shadow-xs hover:-translate-y-0.5 active:translate-y-0',
        glass:
          'bg-surface/90 border border-border/80 text-text hover:bg-surface hover:border-borderStrong shadow-xs hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        sm: 'h-8 px-3.5 text-xs rounded-lg',
        md: 'h-10 px-5 text-sm rounded-xl',
        lg: 'h-12 px-6 text-sm sm:text-base font-semibold rounded-xl',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
