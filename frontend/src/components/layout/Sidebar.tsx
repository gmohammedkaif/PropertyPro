import { Home, LogOut, Shield, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getNavGroups, type NavItem } from '@/components/layout/navConfig'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { useAuthStore, isAdmin } from '@/stores/authStore'
import { useLogout } from '@/hooks/useAuth'

interface SidebarProps {
  collapsed: boolean
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ collapsed, className, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sidebar-glass fixed inset-y-0 left-0 z-[var(--z-sidebar)] hidden flex-col transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:flex',
        collapsed ? 'w-20' : 'w-64',
        className,
      )}
    >
      <SidebarContent collapsed={collapsed} onNavigate={onNavigate} />
    </aside>
  )
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  const handleSignOut = () => {
    logout.mutate()
  }

  return (
    <div className="flex h-full flex-col">
      <Brand collapsed={collapsed} />

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {getNavGroups(user?.roles).map((group) => (
          <div key={group.label} className="space-y-1">
            <p
              className={cn(
                'px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted',
                collapsed && 'sr-only',
              )}
            >
              {group.label}
            </p>

            <ul className="space-y-1">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        {user ? (
          <div
            className={cn(
              'sidebar-item flex items-center gap-2.5 rounded-xl px-2 py-2',
              collapsed && 'justify-center px-1',
            )}
          >
            <Avatar name={user.name} size="sm" status="online" />

            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{user.name}</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold uppercase',
                    isAdmin(user) ? 'text-sky-400' : 'text-emerald-400'
                  )}>
                    {isAdmin(user) ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {isAdmin(user) ? 'Admin' : 'Tenant'}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'hover:bg-danger/20 hover:text-danger')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label="Sign out"
                onClick={handleSignOut}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'hover:bg-danger/20 hover:text-danger')}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <li>
      <NavLink
        to={item.href}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'sidebar-item group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-text2 hover:text-text hover:bg-surface2/50',
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              aria-hidden="true"
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all duration-300',
                isActive ? 'text-white' : 'text-muted group-hover:text-text2',
                'group-hover:scale-110',
              )}
            />

            {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}

            {!collapsed && item.badge ? (
              <Badge intent="primary" size="sm" className="bg-white/20 text-white border-white/20">
                {item.badge}
              </Badge>
            ) : null}
          </>
        )}
      </NavLink>
    </li>
  )
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex h-16 shrink-0 items-center border-b border-border px-4',
        collapsed && 'justify-center px-2',
      )}
    >
      <NavLink to="/app" aria-label="PropManager Pro dashboard" className="flex items-center gap-2.5">
        <span className="bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-primary/30">
          <Home className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-text">PropManager</span>
            <span className="text-[10px] font-semibold text-primary-strong tracking-wider uppercase -mt-1">Pro</span>
          </div>
        ) : null}
      </NavLink>
    </div>
  )
}
