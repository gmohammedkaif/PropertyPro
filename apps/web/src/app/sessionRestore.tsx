import { useEffect } from 'react'

import { restoreSession } from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'

export function SessionRestore() {
  const { user, status } = useAuthStore()

  useEffect(() => {
    // If we already have a user from localStorage (persisted), mark as authenticated
    if (user) {
      useAuthStore.getState().signIn(user, useAuthStore.getState().accessToken ?? 'local')
      return
    }

    // No persisted user — if status is still 'loading', try API restore.
    // On failure, rawRefresh() will call signOut() which sets status = 'unauthenticated'.
    if (status === 'loading') {
      void restoreSession()
    }
  }, [user, status])

  return null
}