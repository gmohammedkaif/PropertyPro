import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full rounded-md border bg-surface text-text shadow-sm transition-all duration-150 placeholder:text-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      intent: {
        default: 'border-border focus:border-primary/60 focus:ring-focus/30',
        error: 'border-danger focus:border-danger focus:ring-danger/25',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      intent: 'default',
      size: 'md',
    },
  },
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      intent,
      size,
      label,
      error,
      helper,
      leftIcon,
      rightSlot,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className="text-xs font-medium text-text2">
            {label}
          </label>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              {leftIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ intent: error ? 'error' : intent, size }),
              leftIcon && 'pl-9',
              rightSlot && 'pr-10',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightSlot ? (
            <span className="absolute inset-y-0 right-2.5 flex items-center">{rightSlot}</span>
          ) : null}
        </div>

        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
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

Input.displayName = 'Input'
