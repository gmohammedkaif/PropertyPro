import { forwardRef, type SelectHTMLAttributes } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

const selectVariants = cva(
  'w-full rounded-lg border text-text shadow-sm transition-all duration-150 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      intent: {
        default: [
          'bg-surface border-border',
          'hover:border-borderStrong',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
        ].join(' '),
        error: 'bg-surface border-danger/60 focus:border-danger focus:ring-2 focus:ring-danger/15',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-11 px-4 text-sm',
      },
    },
    defaultVariants: {
      intent: 'default',
      size: 'md',
    },
  },
)


export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string
  error?: string
  helper?: string
  options?: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, intent, size, label, error, helper, options, placeholder, id, children, ...props },
    ref,
  ) => {
    const inputId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-medium text-text2">
            {label}
          </label>
        ) : null}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(selectVariants({ intent: error ? 'error' : intent, size }), 'appearance-none pr-9 transition-all duration-200', className)}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            ) : null}
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            aria-hidden="true"
          />
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

Select.displayName = 'Select'
