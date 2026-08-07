import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore, isAdmin, isTenantOnly } from '@/stores/authStore'

interface AdminGuardProps {
  children: ReactNode
}

/** Only allows admin/owner/agent users. Redirects tenants to their dashboard. */
export function AdminGuard({ children }: AdminGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!isAdmin(user)) {
    // Tenant tried to access admin/owner page → redirect to tenant home
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

interface SuperAdminGuardProps {
  children: ReactNode
}

/** Only allows Super Admin ('admin') users. Redirects owners and tenants. */
export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!user?.roles.includes('admin')) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

interface TenantGuardProps {
  children: ReactNode
}

/** Only allows tenant users. Redirects admins/owners to their dashboard. */
export function TenantGuard({ children }: TenantGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!isTenantOnly(user)) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
