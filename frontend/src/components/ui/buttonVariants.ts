import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:   'gradient-btn',
        secondary: 'bg-[#193347] border border-[rgba(183,199,214,0.15)] text-[#B7C7D6] hover:bg-[#263E52] hover:border-[rgba(183,199,214,0.25)] hover:text-[#F4F7F8]',
        outline:   'border border-[rgba(183,199,214,0.20)] text-[#91A1B2] hover:bg-[#193347] hover:text-[#B7C7D6] hover:border-[rgba(183,199,214,0.30)]',
        ghost:     'text-[#91A1B2] hover:bg-[#193347] hover:text-[#B7C7D6]',
        danger:    'bg-[#D4726A] text-white hover:bg-[#C4605A] border border-[rgba(212,114,106,0.25)]',
        glass:     'glass text-text hover:bg-[rgba(38,62,82,0.50)]',
      },
      size: {
        sm:      'h-8.5 px-3.5 text-xs',
        md:      'h-10 px-4.5 text-sm',
        lg:      'h-12 px-6 text-base',
        icon:    'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

