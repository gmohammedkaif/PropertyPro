import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface ToggleOption {
  value: string
  label: string
  icon?: ReactNode
}

export interface ToggleProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Toggle({ options, value, onChange, size = 'md', className }: ToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.55 rounded-md border border-border bg-surface p-1 text-sm font-medium',
        size === 'sm' ? 'h-9' : 'h-10',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text2 hover:bg-surface2 hover:text-text',
              size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3.5',
            )}
          >
            {option.icon ? <span className="flex items-center">{option.icon}</span> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
