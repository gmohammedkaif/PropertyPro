import { forwardRef, type HTMLAttributes } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const enhancedCardVariants = cva(
  'rounded-xl border backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface/60',
        glass: 'border-white/10 bg-white/5',
        elevated: 'border-border/60 bg-surface2/80 shadow-lg',
        primary: 'border-primary/30 bg-gradient-to-br from-surface/80 to-surface2/60',
        success: 'border-success/30 bg-gradient-to-br from-surface/80 to-surface2/60',
        warning: 'border-warning/30 bg-gradient-to-br from-surface/80 to-surface2/60',
        danger: 'border-danger/30 bg-gradient-to-br from-surface/80 to-surface2/60',
      },
      size: {
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      hover: {
        true: 'transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-xl',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: true,
    },
  },
)

export interface EnhancedCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  animated?: boolean
  glowIntensity?: 'low' | 'medium' | 'high'
}

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    { className, variant, size, hover, animated = false, glowIntensity = 'medium', ...props },
    ref,
  ) => {
    const glowClass = glowIntensity === 'high' ? 'shadow-lg shadow-primary/30' : glowIntensity === 'medium' ? 'shadow-md' : 'shadow-sm'
    
    return (
      <div
        ref={ref}
        className={cn(
          enhancedCardVariants({ variant, size, hover, className }),
          animated && 'animate-float',
          variant !== 'glass' && glowClass,
          'group relative',
        )}
        {...props}
      />
    )
  },
)

EnhancedCard.displayName = 'EnhancedCard'

export function EnhancedCardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
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

export function EnhancedCardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
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

export function EnhancedCardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
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

export function EnhancedCardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
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

export function EnhancedCardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
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