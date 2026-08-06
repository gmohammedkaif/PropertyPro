import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { type LucideIcon, MoreVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ActionItem {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface ActionsMenuProps {
  items: ActionItem[]
  triggerLabel?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
}

export function ActionsMenu({
  items,
  align = 'end',
  sideOffset = 4,
  className,
}: ActionsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Actions"
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors',
            'hover:bg-surface2 hover:text-text focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg',
            className,
          )}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-[var(--z-dropdown)] min-w-[150px] rounded-md border border-border bg-surface p-1 shadow-lg shadow-black/15',
            'focus:outline-none',
          )}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onClick}
              className={cn(
                'dropdown-item',
                item.destructive ? 'text-danger data-[highlighted]:bg-danger-soft' : '',
              )}
            >
              {item.icon ? <item.icon className="h-4 w-4" aria-hidden="true" /> : null}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
