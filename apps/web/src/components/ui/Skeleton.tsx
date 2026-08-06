import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/** Shimmering placeholder used while content loads. Enforces the loading state pattern. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden rounded-md bg-surface3', className)}
      {...props}
    >
      <div
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{ transform: 'translateX(-100%)' }}
      />
    </div>
  )
}
