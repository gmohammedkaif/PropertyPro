import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

/** Redirects unauthenticated visitors to the login screen, preserving intent. */
export function AuthGuard({ children }: PropsWithChildren) {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Restoring session…" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}