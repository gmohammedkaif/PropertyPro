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
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useEffect } from 'react'

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

  const notifications = useNotificationsStore((s) => s.items)
  const fetchNotifications = useNotificationsStore((s) => s.fetch)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleSignOut = () => {
    logout.mutate()
  }

  const properties = useLocalPropertiesStore((s) => s.items)

  let title = getPageTitle(location.pathname)

  const propertyDetailMatch = location.pathname.match(/^\/app\/propert(?:ies|y)\/([^/]+)/)
  if (propertyDetailMatch) {
    const propertyId = propertyDetailMatch[1]
    const property = properties.find((p) => p.id === propertyId)
    if (property) {
      title = property.name
    } else {
      title = 'Property Detail'
    }
  }

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
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
        <h1 className="truncate text-sm font-bold text-text tracking-tight">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative hidden md:block group">
          <Search
            className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-muted transition-colors group-focus-within:text-primary"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder={
              location.pathname.includes('/app/properties') || location.pathname.includes('/app/property')
                ? 'Search properties...'
                : location.pathname.includes('/app/tenancies')
                ? 'Search tenants or leases...'
                : location.pathname.includes('/app/payments')
                ? 'Search payments...'
                : location.pathname.includes('/app/maintenance')
                ? 'Search maintenance requests...'
                : location.pathname.includes('/app/analytics')
                ? 'Search reports...'
                : location.pathname.includes('/app/settings')
                ? 'Search settings...'
                : 'Search your portfolio...'
            }
            aria-label="Search"
            className="glass-input h-9 w-40 pl-12 pr-12 text-xs lg:w-56 !bg-surface2"
          />
          <kbd className="pointer-events-none absolute inset-y-0 right-2.5 my-auto hidden h-5 items-center rounded border border-border bg-surface3 px-1.5 text-[9px] font-bold text-muted lg:flex shadow-sm">
            ⌘K
          </kbd>
        </div>

        <ThemeToggle />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus')}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface"
                />
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="glass z-[var(--z-dropdown)] w-80 rounded-xl p-1.5 shadow-lg max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-2.5 py-2">
                <p className="text-sm font-semibold text-text">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="my-1 h-px bg-border" />

              {notifications.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <DropdownMenu.Item
                    key={n.id}
                    onSelect={() => markAsRead(n.id)}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-2.5 py-2 text-left text-xs outline-none transition-colors focus:bg-surface2 cursor-pointer",
                      !n.read && "bg-primary/5 font-medium"
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full mt-1.5",
                        n.type === 'success' && 'bg-success',
                        n.type === 'warning' && 'bg-warning',
                        n.type === 'danger' && 'bg-danger',
                        n.type === 'info' && 'bg-info',
                      )} />
                      <div className="flex-1">
                        <p className="font-semibold text-text">{n.title}</p>
                        <p className="text-muted line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

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
