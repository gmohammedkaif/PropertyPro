import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getPageTitle } from '@/components/layout/navConfig'
import { Avatar } from '@/components/ui/Avatar'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUiStore } from '@/stores/uiStore'

interface NavbarProps {
  onMenuClick: () => void
  onCollapseToggle: () => void
}

export function Navbar({ onMenuClick, onCollapseToggle }: NavbarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = () => {
    logout.mutate()
  }

  const title = getPageTitle(location.pathname)

  return (
    <header className="glass-subtle sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'lg:hidden')}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onCollapseToggle}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'hidden lg:inline-flex')}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <div className="hidden min-w-0 md:block">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Workspace</p>
        <h1 className="truncate text-lg font-bold font-display text-text sm:text-xl">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative hidden md:block">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="h-9 w-40 rounded-lg border border-border bg-surface/60 pl-9 pr-12 text-sm text-text outline-none transition-all duration-150 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-focus/30 lg:w-56"
          />
          <kbd className="pointer-events-none absolute inset-y-0 right-2.5 my-auto hidden h-5 items-center rounded border border-border bg-surface2 px-1.5 text-[10px] font-medium text-muted lg:flex">
            ⌘K
          </kbd>
        </div>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative')}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface"
          />
        </button>

        {user ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="ml-1 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <Avatar name={user.name} size="md" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="glass z-[var(--z-dropdown)] w-56 rounded-xl p-1.5 shadow-lg"
              >
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <Avatar name={user.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>

                <div className="my-1 h-px bg-border" />

                <DropdownMenu.Item
                  onSelect={() => navigate('/app/settings')}
                  className="dropdown-item"
                >
                  Settings
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={handleSignOut}
                  className="dropdown-item text-danger focus:text-danger"
                >
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}
      </div>
    </header>
  )
}
