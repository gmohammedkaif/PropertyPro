import { forwardRef, type HTMLAttributes } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const glassCardVariants = cva(
  'rounded-xl border relative overflow-hidden',
  {
    variants: {
      variant: {
        default:   'border-border bg-surface shadow-sm',
        primary:   'border-primary/20 bg-surface shadow-sm',
        secondary: 'border-border bg-surface shadow-sm',
        success:   'border-success/20 bg-surface shadow-sm',
        warning:   'border-warning/20 bg-surface shadow-sm',
        danger:    'border-danger/20 bg-surface shadow-sm',
        glass:     'border-border bg-surface shadow-sm',
        elevated:  'border-border bg-surface shadow-md',
      },
      size: {
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      withGlow: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      withGlow: false,
    },
  },
)


const hoverEffects =
  'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-borderStrong cursor-pointer'

export interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  hover?: boolean
  animated?: boolean
  glowIntensity?: 'low' | 'medium' | 'high'
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, variant, size, withGlow, hover = false, animated = false, glowIntensity = 'medium', ...props },
    ref,
  ) => {
    const glowClass = glowIntensity === 'high' ? 'shadow-xl' : glowIntensity === 'medium' ? 'shadow-lg' : 'shadow-md'
    
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, size, withGlow, className }),
          withGlow ? glowClass : '',
          hover ? hoverEffects : '',
          animated && 'animate-float',
          'group relative',
          className,
        )}
        {...props}
      />
    )
  },
)

GlassCard.displayName = 'GlassCard'

export function GlassCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 mb-4 pb-4 border-b border-border/40',
        className,
      )}
      {...props}
    />
  )
}

export function GlassCardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold tracking-tight text-text',
        className,
      )}
      {...props}
    />
  )
}

export function GlassCardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-muted',
        className,
      )}
      {...props}
    />
  )
}

export function GlassCardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        '',
        className,
      )}
      {...props}
    />
  )
}

export function GlassCardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 mt-6 pt-4 border-t border-border/40',
        className,
      )}
      {...props}
    />
  )
}

export function GlassCardBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-primary/20 text-primary border border-primary/30',
        className,
      )}
      {...props}
    />
  )
}
