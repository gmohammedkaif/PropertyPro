import { forwardRef, type HTMLAttributes } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const glassCardVariants = cva(
  'rounded-xl border relative overflow-hidden',
  {
    variants: {
      variant: {
        default:   'border-border/80 bg-surface/95 backdrop-blur-sm shadow-sm',
        primary:   'border-primary/30 bg-gradient-to-br from-surface to-surface2 backdrop-blur-md',
        secondary: 'border-[rgba(183,199,214,0.20)] bg-gradient-to-br from-surface to-surface2 backdrop-blur-md',
        success:   'border-success/25 bg-gradient-to-br from-surface to-surface2 backdrop-blur-md',
        warning:   'border-warning/30 bg-gradient-to-br from-surface to-surface2 backdrop-blur-md',
        danger:    'border-danger/30 bg-gradient-to-br from-surface to-surface2 backdrop-blur-md',
        glass:     'border-[rgba(183,199,214,0.18)] bg-surface/90 backdrop-blur-xl',
        elevated:  'border-[rgba(183,199,214,0.20)] bg-surface2 shadow-lg',
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
    compoundVariants: [
      {
        variant: 'primary',
        withGlow: true,
        className: 'shadow-[0_0_28px_rgba(47,127,130,0.20)]',
      },
      {
        variant: 'secondary',
        withGlow: true,
        className: 'shadow-[0_0_28px_rgba(183,199,214,0.15)]',
      },
      {
        variant: 'success',
        withGlow: true,
        className: 'shadow-[0_0_28px_rgba(169,216,213,0.18)]',
      },
      {
        variant: 'warning',
        withGlow: true,
        className: 'shadow-[0_0_28px_rgba(232,168,76,0.18)]',
      },
      {
        variant: 'danger',
        withGlow: true,
        className: 'shadow-[0_0_28px_rgba(212,114,106,0.18)]',
      },
      {
        variant: 'glass',
        withGlow: true,
        className: 'shadow-[0_0_36px_rgba(47,127,130,0.14)]',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      withGlow: false,
    },
  },
)


const hoverEffects =
  'transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-xl'

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
