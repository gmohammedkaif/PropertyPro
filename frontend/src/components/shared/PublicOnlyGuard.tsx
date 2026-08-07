import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

/** Keeps already-authenticated users out of auth screens. */
export function PublicOnlyGuard({ children }: PropsWithChildren) {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Restoring session…" />
      </div>
    )
  }

  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}