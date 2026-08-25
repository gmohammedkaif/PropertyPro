import { forwardRef, type ReactNode } from 'react'
import { type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

export interface EnhancedButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  children?: ReactNode
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  glowIntensity?: 'low' | 'medium' | 'high' | string
  shimmer?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, loading, disabled, children, leftIcon, rightIcon, glowIntensity, shimmer, ...props }, ref) => {
    const baseClasses = cn(
      buttonVariants({ variant, size }),
      className,
    )

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5">{leftIcon}</span>
        ) : null}

        <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>

        {rightIcon && !loading && (
          <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-1">{rightIcon}</span>
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
