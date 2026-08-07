import type { ReactNode } from 'react'

import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-borderStrong bg-surface2/50 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {description ? <p className="mx-auto max-w-sm text-sm text-muted">{description}</p> : null}
      </div>

      {action}
    </div>
  )
}
