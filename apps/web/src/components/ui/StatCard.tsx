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
    primary: 'bg-sky-500/10 text-sky-400 border border-sky-500/15',
    secondary: 'bg-purple-500/10 text-purple-400 border border-purple-500/15',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/15',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/15',
  }

  return (
    <div className={cn(
      'relative flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-300 hover:border-primary/20 hover:shadow-lg',
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