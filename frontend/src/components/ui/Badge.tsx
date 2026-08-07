import { forwardRef, type HTMLAttributes } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-medium', {
  variants: {
    intent: {
      neutral: 'bg-surface2 text-text2',
      primary: 'bg-primary-soft text-primary',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
    },
    size: {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    },
  },
  defaultVariants: {
    intent: 'neutral',
    size: 'md',
  },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, intent, size, dot, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ intent, size }), className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  ),
)

Badge.displayName = 'Badge'
