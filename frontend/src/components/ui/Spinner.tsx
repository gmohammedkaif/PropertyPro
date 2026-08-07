import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SpinnerProps {
  size?: number | string
  className?: string
  label?: string
}

export function Spinner({ size = 20, className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-primary', className)}
    >
      <Loader2 aria-hidden="true" className="animate-spin" style={{ width: size, height: size }} />
      <span className="sr-only">{label}</span>
    </span>
  )
}
