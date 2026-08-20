import { useEffect } from 'react'

import { logout, restoreSession } from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { INACTIVITY_STORAGE_KEY, INACTIVITY_TIMEOUT_MS } from '@/shared'

/**
 * Runs once on mount. Checks if saved activity timestamp is expired.
 * If status is still 'loading' (rare: storage read not yet finished),
 * we try the API refresh to determine the session state.
 */
export function SessionRestore() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      try {
        const rawTimestamp = localStorage.getItem(INACTIVITY_STORAGE_KEY)
        if (rawTimestamp) {
          const lastActivity = Number(rawTimestamp)
          if (!isNaN(lastActivity) && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
            try {
              sessionStorage.setItem('propertypro_session_expired', 'inactivity')
            } catch {
              /* ignore storage errors */
            }
            void logout()
            return
          }
        }
      } catch {
        /* ignore storage read error */
      }
    }

    if (status === 'loading') {
      void restoreSession()
    }
  }, [status, user])

  return null
}