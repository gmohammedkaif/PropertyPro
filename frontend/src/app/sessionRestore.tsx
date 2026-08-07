import { useEffect } from 'react'

import { restoreSession } from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'

/**
 * Runs once on mount. If onRehydrateStorage already set a non-loading status
 * (user found or not found in localStorage), we do nothing.
 * Only when status is still 'loading' (rare: storage read not yet finished) do
 * we try the API refresh to determine the session state.
 */
export function SessionRestore() {
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    // onRehydrateStorage in authStore handles the common case:
    // - user in localStorage → status = 'authenticated'
    // - no user in localStorage → status = 'unauthenticated'
    // We only need to call the API if somehow status is still 'loading'
    if (status === 'loading') {
      void restoreSession()
    }
  }, [status])

  return null
}