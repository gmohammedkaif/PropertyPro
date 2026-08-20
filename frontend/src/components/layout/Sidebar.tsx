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
        collapsed ? 'w-[4.5rem]' : 'w-60',
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

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 custom-scrollbar" aria-label="Main navigation">
        {getNavGroups(user?.roles).map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p
              className={cn(
                'px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.10em] text-muted',
                collapsed && 'sr-only',
              )}
            >
              {group.label}
            </p>

            <ul className="space-y-0.5">
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

      {/* User area at bottom */}
      <div className="border-t border-border p-3">
        {user ? (
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl p-2 transition-colors duration-150',
              collapsed && 'justify-center p-1.5',
            )}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" status="online" />

            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text leading-tight">{user.name}</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold mt-0.5',
                    isAdmin(user) ? 'text-primary' : 'text-success'
                  )}>
                    {isAdmin(user) ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                    {isAdmin(user) ? 'Admin' : 'Tenant'}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'hover:bg-danger/10 hover:text-danger rounded-lg shrink-0 transition-colors duration-150')}
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
            'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            collapsed && 'justify-center px-0 mx-auto w-10 h-10',
            isActive
              ? 'bg-primary/[0.08] text-primary font-semibold'
              : 'text-text2 hover:text-text hover:bg-surface3',
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              aria-hidden="true"
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted group-hover:text-text2',
              )}
            />

            {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}

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
        'flex h-14 shrink-0 items-center border-b border-border px-4',
        collapsed && 'justify-center px-2',
      )}
    >
      <NavLink to="/app" aria-label="PropManager Pro dashboard" className="flex items-center gap-2.5 group">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
          <Home className="h-4 w-4" aria-hidden="true" />
        </span>
        {!collapsed ? (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold tracking-tight text-text leading-none">PropManager</span>
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase mt-0.5">Pro</span>
          </div>
        ) : null}
      </NavLink>
    </div>
  )
}
