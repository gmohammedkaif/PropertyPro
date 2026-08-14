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
    const glowClass = glowIntensity === 'high'
      ? 'shadow-[0_0_28px_rgba(47,127,130,0.35)]'
      : glowIntensity === 'medium'
      ? 'shadow-[0_0_18px_rgba(47,127,130,0.25)]'
      : 'shadow-sm'

    const variantClasses = {
      primary:   'gradient-btn',
      secondary: 'bg-[#193347] border border-[rgba(183,199,214,0.15)] text-[#B7C7D6] hover:bg-[#263E52] hover:border-[rgba(183,199,214,0.25)] hover:text-[#F4F7F8]',
      outline:   'border border-[rgba(183,199,214,0.20)] text-[#91A1B2] hover:bg-[#193347] hover:text-[#B7C7D6] hover:border-[rgba(183,199,214,0.30)]',
      ghost:     'text-[#91A1B2] hover:bg-[#193347] hover:text-[#B7C7D6]',
      danger:    'bg-[#D4726A] text-white hover:bg-[#C4605A] border border-[rgba(212,114,106,0.25)]',
      glass:     'bg-[rgba(38,62,82,0.55)] border border-[rgba(183,199,214,0.12)] text-text hover:bg-[rgba(51,75,96,0.65)] hover:border-[rgba(183,199,214,0.22)] backdrop-blur-sm',
    }
    
    const baseClasses = cn(
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold overflow-hidden',
      'transition-all duration-200 ease-[var(--ease-out)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'disabled:pointer-events-none disabled:opacity-50 select-none',
      'group/btn',
      /* Default to primary (teal gradient) if no variant or unrecognized variant */
      variantClasses[(variant ?? 'primary') as keyof typeof variantClasses] ?? variantClasses.primary,
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
