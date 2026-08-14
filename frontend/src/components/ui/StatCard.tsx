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
      'stats-card relative flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-300',
      className
    )}>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted truncate">{title}</span>
        <p className="font-display text-2xl font-bold text-text tabular-nums truncate">{value}</p>
      </div>
      {Icon ? (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300', iconColors[variant])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}