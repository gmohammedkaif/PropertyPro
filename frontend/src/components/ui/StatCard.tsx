import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const iconColors = {
    default: 'bg-slate-500/10 text-slate-400 border border-slate-500/15',
    primary: 'bg-primary/10 text-primary border border-primary/15',
    secondary: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15',
    success: 'bg-success/10 text-success border border-success/15',
    warning: 'bg-warning/10 text-warning border border-warning/15',
    danger: 'bg-danger/10 text-danger border border-danger/15',
  }

  return (
    <div className={cn(
      'stats-card relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-all duration-200 h-28 hover:-translate-y-0.5 hover:shadow-md hover:border-borderStrong select-none',
      className
    )}>
      <div className="flex items-start justify-between gap-4 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">{title}</span>
        {Icon ? (
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200', iconColors[variant])}>
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