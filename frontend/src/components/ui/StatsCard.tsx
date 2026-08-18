import { type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string
  icon?: LucideIcon
  className?: string
}

export function StatsCard({ title, value, icon: Icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      'stats-card relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-all duration-200 h-28 hover:-translate-y-0.5 hover:shadow-md hover:border-borderStrong select-none',
      className
    )}>
      <div className="flex items-start justify-between gap-4 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">{title}</span>
        {Icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15 transition-all duration-200">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className="mt-auto pt-2">
        <p className="font-display text-2xl font-bold text-text tabular-nums leading-none">{value}</p>
      </div>
    </div>
  )
}
