import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number
  variant?: 'inline' | 'overlay'
  className?: string
  label?: string
}

const SIZE_MAP = {
  sm: 16,
  md: 22,
  lg: 32,
}

export function LoadingSpinner({
  size = 'md',
  variant = 'inline',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 22

  const spinnerIcon = (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-primary', className)}
    >
      <Loader2
        aria-hidden="true"
        className="animate-spin"
        style={{ width: pixelSize, height: pixelSize }}
      />
      <span className="sr-only">{label}</span>
    </span>
  )

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-inherit bg-surface/70 backdrop-blur-xs transition-opacity duration-200">
        {spinnerIcon}
      </div>
    )
  }

  return spinnerIcon
}
