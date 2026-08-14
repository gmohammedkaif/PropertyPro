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
      'stats-card relative flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-300',
      className
    )}>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted truncate">{title}</span>
        <p className="font-display text-2xl font-bold text-text tabular-nums truncate">{value}</p>
      </div>
      {Icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}
