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
        'sidebar-glass fixed inset-y-0 left-0 h-screen max-h-screen z-[var(--z-sidebar)] hidden flex-col transition-[width] duration-300 ease-[var(--ease-out-expo)] lg:flex',
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
    <div className="flex h-full max-h-full flex-col">
      <Brand collapsed={collapsed} />

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 custom-scrollbar" aria-label="Main navigation">
        {getNavGroups(user?.roles).map((group) => (
          <div key={group.label} className="space-y-1.5">
            <p
              className={cn(
                'px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted opacity-80',
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

      <div className="border-t border-border/40 p-3 bg-surface-2/20 backdrop-blur-md">
        {user ? (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border/50 bg-surface-2/40 p-2.5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-surface-2/75 hover:shadow-md',
              collapsed && 'justify-center p-1 border-transparent bg-transparent shadow-none',
            )}
          >
            <Avatar name={user.name} size="sm" status="online" />

            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-text leading-tight">{user.name}</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest mt-1',
                    isAdmin(user) ? 'text-primary' : 'text-emerald-500'
                  )}>
                    {isAdmin(user) ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                    {isAdmin(user) ? 'Admin' : 'Tenant'}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'hover:bg-danger/10 hover:text-danger rounded-lg shrink-0 transition-colors duration-200')}
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </>
            ) : null}
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
            'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300 border',
            collapsed && 'justify-center px-0 mx-auto w-10 h-10',
            isActive
              ? 'bg-primary/5 text-primary border-primary/20 shadow-sm shadow-primary/5'
              : 'text-text2 hover:text-text hover:bg-surface2/60 border-transparent',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
                aria-hidden="true"
              />
            )}
            <item.icon
              aria-hidden="true"
              className={cn(
                'h-4.5 w-4.5 shrink-0 transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted group-hover:text-text2',
                'group-hover:scale-105',
              )}
            />

            {!collapsed ? <span className="flex-1 truncate tracking-wide">{item.label}</span> : null}

            {!collapsed && item.badge ? (
              <Badge intent="primary" size="sm">
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
        'flex h-16 shrink-0 items-center border-b border-border/40 px-4',
        collapsed && 'justify-center px-2',
      )}
    >
      <NavLink to="/app" aria-label="PropManager Pro dashboard" className="flex items-center gap-3 group">
        <span className="bg-gradient-to-tr from-primary to-primary-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
          <Home className="h-5 w-5" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-text font-display leading-none">PropManager</span>
            <span className="text-[10px] font-extrabold text-primary-strong tracking-widest uppercase mt-0.5">Pro</span>
          </div>
        ) : null}
      </NavLink>
    </div>
  )
}
