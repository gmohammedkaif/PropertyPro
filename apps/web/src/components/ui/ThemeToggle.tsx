import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/buttonVariants'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function ThemeToggle() {
  const { mode, setMode, isDark } = useTheme()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Theme preferences"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="glass z-[var(--z-dropdown)] w-44 rounded-xl p-1.5 shadow-lg"
        >
          {OPTIONS.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => setMode(option.value)}
              className="dropdown-item"
            >
              <option.icon className="h-4 w-4 text-muted" aria-hidden="true" />
              <span className="flex-1">{option.label}</span>
              {mode === option.value ? (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
