import { forwardRef, type ReactNode } from 'react'

import { EnhancedButton } from '@/components/ui/EnhancedButton'

export interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'style'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  loading?: boolean
  children?: ReactNode
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  shimmer?: boolean
  glowIntensity?: 'low' | 'medium' | 'high'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    leftIcon,
    rightIcon,
    shimmer = false,
    glowIntensity = 'medium',
    ...props
  }, ref) => {
    return (
      <EnhancedButton
        ref={ref}
        variant={variant}
        size={size}
        loading={loading}
        disabled={disabled}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        shimmer={shimmer}
        glowIntensity={glowIntensity}
        className={className}
        {...props}
      >
        {children}
      </EnhancedButton>
    )
  },
)

Button.displayName = 'Button'
