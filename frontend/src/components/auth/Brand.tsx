import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BrandProps {
  inverted?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Brand({ inverted = false, size = 'md', className }: BrandProps) {
  const iconSizes = {
    sm: 'h-7 w-7 rounded-lg text-sm',
    md: 'h-9 w-9 rounded-xl text-base',
    lg: 'h-10 w-10 rounded-xl text-lg',
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  }

  const iconDim = {
    sm: 'h-4 w-4',
    md: 'h-4.5 w-4.5',
    lg: 'h-5 w-5',
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <span
        className={cn(
          'bg-brand-gradient flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105',
          iconSizes[size],
        )}
      >
        <Home className={iconDim[size]} aria-hidden="true" />
      </span>
      <span
        className={cn(
          'font-extrabold tracking-tight font-display leading-none',
          textSizes[size],
          inverted ? 'text-white' : 'text-text',
        )}
      >
        Property<span className="text-primary">Pro</span>
      </span>
    </div>
  )
}