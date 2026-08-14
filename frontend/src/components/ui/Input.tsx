import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full rounded-xl border text-text shadow-sm transition-all duration-200 placeholder:text-muted/80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      intent: {
        default: [
          'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-surface-4)] hover:border-[rgba(183,199,214,0.25)]',
          'focus:bg-[var(--color-surface-2)] focus:border-[#2F7F82] focus:ring-4 focus:ring-[rgba(47,127,130,0.15)]',
        ].join(' '),
        error: [
          'bg-[var(--color-surface-3)] border-danger/60',
          'focus:border-danger focus:bg-[var(--color-surface-2)] focus:ring-4 focus:ring-danger/10',
        ].join(' '),
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
  labelRight?: ReactNode
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
      labelRight,
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
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-text/80 tracking-wide">
              {label}
            </label>
            {labelRight}
          </div>
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
              leftIcon && 'pl-10',
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
