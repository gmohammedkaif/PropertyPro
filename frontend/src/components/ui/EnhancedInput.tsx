import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const enhancedInputVariants = cva(
  'w-full rounded-md border text-text transition-all duration-150 placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface3 disabled:text-muted',
  {
    variants: {
      intent: {
        default: [
          'bg-surface border-border',
          'hover:border-borderStrong',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
        ].join(' '),
        error: [
          'bg-surface border-danger/60',
          'focus:border-danger focus:ring-2 focus:ring-danger/15',
        ].join(' '),
        success: [
          'bg-surface border-success/40',
          'focus:border-success focus:ring-2 focus:ring-success/15',
        ].join(' '),
        warning: [
          'bg-surface border-warning/40',
          'focus:border-warning focus:ring-2 focus:ring-warning/15',
        ].join(' '),
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-11 px-4 text-sm',
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
  labelRight?: ReactNode
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
      labelRight,
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
        case 'primary': return 'focus:ring-2 focus:ring-primary/20 focus:border-primary/60'
        case 'success': return 'focus:ring-2 focus:ring-success/20 focus:border-success'
        case 'warning': return 'focus:ring-2 focus:ring-warning/20 focus:border-warning'
        case 'danger': return 'focus:ring-2 focus:ring-danger/20 focus:border-danger'
        case 'secondary': return 'focus:ring-2 focus:ring-secondary/20 focus:border-secondary'
        default: return 'focus:ring-2 focus:ring-primary/20 focus:border-primary/60'
      }
    }

    const intentClass = error ? 'error' : intent
    
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label ? (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-text/80 tracking-wide">
              {label}
            </label>
            {labelRight}
          </div>
        ) : null}

        <div className="relative group">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text2/50 transition-colors group-focus-within:text-primary">
              {leftIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              enhancedInputVariants({ intent: intentClass, size, withIcon }),
              getFocusColor(),
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon ? (
            <span className="absolute inset-y-0 right-3.5 flex items-center text-text2/50 transition-colors group-focus-within:text-primary">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-danger font-medium animate-in fade-in-0 mt-0.5">
            {error}
          </p>
        ) : helper ? (
          <p id={`${inputId}-helper`} className="text-xs text-muted mt-0.5">
            {helper}
          </p>
        ) : null}
      </div>
    )
  },
)

EnhancedInput.displayName = 'EnhancedInput'