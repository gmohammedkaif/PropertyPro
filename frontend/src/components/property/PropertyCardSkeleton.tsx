import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export interface PropertyCardSkeletonProps {
  className?: string
}

export function PropertyCardSkeleton({ className }: PropertyCardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'group flex flex-col h-full overflow-hidden rounded-2xl border border-border/60 bg-surface/40 shadow-xs backdrop-blur-xs',
        className
      )}
    >
      {/* Image Area Skeleton */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface3/80">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Top Badges Skeleton */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full bg-surface2/90" />
          <Skeleton className="h-5 w-16 rounded-full bg-surface2/90" />
        </div>

        {/* Top-Right Favorite Button Skeleton */}
        <div className="absolute right-3 top-3">
          <Skeleton className="h-8 w-8 rounded-full bg-surface2/90" />
        </div>

        {/* Bottom Price Bar Skeleton */}
        <div className="absolute bottom-3 left-3 right-3">
          <Skeleton className="h-6 w-32 rounded-md bg-surface2/90" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3.5">
        {/* Title & Location */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
          </div>
        </div>

        {/* Description Placeholder */}
        <div className="space-y-1.5 py-0.5">
          <Skeleton className="h-3 w-full rounded-sm" />
          <Skeleton className="h-3 w-4/5 rounded-sm" />
        </div>

        {/* Specs Bar (3 columns) */}
        <div className="mt-auto pt-3 border-t border-border/50 grid grid-cols-3 gap-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
        </div>
      </div>
    </div>
  )
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}
