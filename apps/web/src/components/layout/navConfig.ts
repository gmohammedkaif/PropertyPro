import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react'

import type { Role } from '@propertypro/shared'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  end?: boolean
  roles?: Role[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
  roles?: Role[]
}

// ─── Admin/Owner/Agent navigation ─────────────────────────────────────────────

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/app', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Owner Requests', href: '/app/owner-requests', icon: UserCheck, roles: ['admin'] },
      { label: 'Tenant Requests', href: '/app/tenant-requests', icon: ClipboardList },
      { label: 'Properties', href: '/app/properties', icon: Building2 },
      { label: 'Tenancies', href: '/app/tenancies', icon: Users },
      { label: 'Payments', href: '/app/payments', icon: Receipt },
      { label: 'Maintenance', href: '/app/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Analytics', href: '/app/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]

// ─── Tenant navigation ────────────────────────────────────────────────────────

export const TENANT_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'My Dashboard', href: '/app', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'My Home',
    items: [
      { label: 'My Rent', href: '/app/my-rent', icon: Receipt },
      { label: 'Report Issue', href: '/app/report-issue', icon: ClipboardList },
      { label: 'My Lease', href: '/app/my-lease', icon: FileText },
    ],
  },
  {
    label: 'Explore',
    items: [
      { label: 'Properties', href: '/app/properties', icon: Home },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/app/settings', icon: Settings },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasAnyRole(roles: Role[] | undefined, userRoles: Role[] | undefined): boolean {
  if (!roles || roles.length === 0) return true
  if (!userRoles || userRoles.length === 0) return false
  return roles.some((role) => userRoles.includes(role))
}

export function getNavGroups(userRoles: Role[] | undefined): NavGroup[] {
  const hasAdmin = userRoles?.some((r) => ['owner', 'agent', 'admin'].includes(r))
  const baseGroups = hasAdmin ? ADMIN_NAV_GROUPS : TENANT_NAV_GROUPS

  return baseGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyRole(item.roles, userRoles)),
    }))
    .filter((group) => group.items.length > 0)
}

export function getPageTitle(pathname: string): string {
  if (pathname === '/app') return 'Dashboard'

  const allItems = [...ADMIN_NAV_GROUPS, ...TENANT_NAV_GROUPS].flatMap((g) => g.items)
  const match = allItems.find((item) => pathname.startsWith(item.href) && item.href !== '/app')
  return match?.label ?? humanize(pathname)
}

function humanize(path: string): string {
  const segment = path.split('/').filter(Boolean).pop() ?? 'Home'
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
