import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const enhancedInputVariants = cva(
  'w-full rounded-md border bg-surface/50 backdrop-blur-sm text-text shadow-sm transition-all duration-300 placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      intent: {
        default: 'border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/30',
        error: 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/25',
        success: 'border-success focus:border-success focus:ring-2 focus:ring-success/25',
        warning: 'border-warning focus:border-warning focus:ring-2 focus:ring-warning/25',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      withIcon: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      intent: 'default',
      size: 'md',
      withIcon: false,
    },
  },
)

export interface EnhancedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof enhancedInputVariants> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
  focusColor?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      className,
      containerClassName,
      intent,
      size,
      withIcon,
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      id,
      focusColor = 'primary',
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name
    
    const getFocusColor = () => {
      switch (focusColor) {
        case 'primary': return 'focus:ring-primary/30 focus:border-primary/60'
        case 'success': return 'focus:ring-success/25 focus:border-success'
        case 'warning': return 'focus:ring-warning/25 focus:border-warning'
        case 'danger': return 'focus:ring-danger/25 focus:border-danger'
        case 'secondary': return 'focus:ring-secondary/30 focus:border-secondary'
        default: return 'focus:ring-primary/30 focus:border-primary/60'
      }
    }

    const intentClass = error ? 'error' : intent
    
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className="text-xs font-medium text-text2">
            {label}
          </label>
        ) : null}

        <div className="relative group">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted transition-colors group-focus-within:text-primary">
              {leftIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              enhancedInputVariants({ intent: intentClass, size, withIcon, className: getFocusColor() }),
              leftIcon && 'pl-9',
              rightIcon && 'pr-10',
              'hover:bg-surface/70',
              'focus:shadow-lg',
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon ? (
            <span className="absolute inset-y-0 right-3 flex items-center text-muted transition-colors group-focus-within:text-primary">
              {rightIcon}
            </span>
          ) : null}
          
          <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-focus-within:opacity-100 pointer-events-none" />
        </div>

        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-danger animate-in fade-in-0">
            {error}
          </p>
        ) : helper ? (
          <p id={`${inputId}-helper`} className="text-xs text-muted">
            {helper}
          </p>
        ) : null}
      </div>
    )
  },
)

EnhancedInput.displayName = 'EnhancedInput'