import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const enhancedInputVariants = cva(
  'w-full rounded-xl border text-text shadow-sm transition-all duration-200 placeholder:text-muted/80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      intent: {
        default: [
          'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-surface-4)] hover:border-[rgba(183,199,214,0.25)]',
          'focus:bg-[var(--color-surface-2)] focus:border-[#2F7F82] focus:ring-4 focus:ring-[rgba(47,127,130,0.14)]',
        ].join(' '),
        error: [
          'bg-[var(--color-surface-3)] border-danger/60',
          'focus:border-danger focus:bg-[var(--color-surface-2)] focus:ring-4 focus:ring-danger/10',
        ].join(' '),
        success: [
          'bg-[var(--color-surface-3)] border-success/40',
          'focus:border-success focus:bg-[var(--color-surface-2)] focus:ring-4 focus:ring-success/10',
        ].join(' '),
        warning: [
          'bg-[var(--color-surface-3)] border-warning/40',
          'focus:border-warning focus:bg-[var(--color-surface-2)] focus:ring-4 focus:ring-warning/10',
        ].join(' '),
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
        case 'primary': return 'focus:ring-primary/10 focus:border-primary/60'
        case 'success': return 'focus:ring-success/10 focus:border-success'
        case 'warning': return 'focus:ring-warning/10 focus:border-warning'
        case 'danger': return 'focus:ring-danger/10 focus:border-danger'
        case 'secondary': return 'focus:ring-secondary/10 focus:border-secondary'
        default: return 'focus:ring-primary/10 focus:border-primary/60'
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
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
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