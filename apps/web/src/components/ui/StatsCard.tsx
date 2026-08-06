import { type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

export interface StatsCardProps {
  title: string
  value: string
  icon?: LucideIcon
  className?: string
}

export function StatsCard({ title, value, icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn('p-5 transition-all duration-200 hover:shadow-md', className)}>
      {Icon ? (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-[16px] w-[16px]" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium uppercase tracking-[0.06em] text-muted">{title}</span>
        </div>
      ) : (
        <span className="text-sm font-medium uppercase tracking-[0.06em] text-muted">{title}</span>
      )}

      <p className="tabular mt-2 text-2xl font-bold tracking-tight text-text">{value}</p>
    </Card>
  )
}
