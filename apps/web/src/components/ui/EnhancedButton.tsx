import { forwardRef, type ReactNode } from 'react'

import { type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

export interface EnhancedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  children?: ReactNode
  glowIntensity?: 'low' | 'medium' | 'high'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  shimmer?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    { className, variant, size, loading, disabled, children, glowIntensity = 'medium', leftIcon, rightIcon, shimmer = false, ...props },
    ref,
  ) => {
    const glowClass = glowIntensity === 'high' ? 'shadow-lg shadow-primary/40' : glowIntensity === 'medium' ? 'shadow-md shadow-primary/30' : 'shadow-sm'
    
    const variantClasses = {
      primary: 'gradient-btn',
      secondary: 'bg-surface2/80 backdrop-blur-sm border border-border text-text hover:bg-surface2',
      ghost: 'hover:bg-surface2/50 text-text2 hover:text-text',
      danger: 'bg-danger/90 backdrop-blur-sm border border-danger/30 text-white hover:bg-danger',
      glass: 'glass text-text hover:glass-hover',
    }
    
    const baseClasses = cn(
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium overflow-hidden',
      'transition-all duration-300 ease-[var(--ease-out)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'disabled:pointer-events-none disabled:opacity-50 select-none',
      'group/btn',
      glowClass,
      variantClasses[variant as keyof typeof variantClasses] || '',
      className,
    )
    
    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover/btn:animate-shimmer" />
        )}
        
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        
        {leftIcon && !loading && <span className="shrink-0">{leftIcon}</span>}
        
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
        
        {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
        
        {(variant === 'primary' || variant === 'glass') && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover/btn:opacity-100" />
        )}
      </motion.button>
    )
  },
)

EnhancedButton.displayName = 'EnhancedButton'

export const PrimaryButton = EnhancedButton
export const SecondaryButton = EnhancedButton
export const GhostButton = EnhancedButton
export const DangerButton = EnhancedButton
export const GlassButton = EnhancedButton
