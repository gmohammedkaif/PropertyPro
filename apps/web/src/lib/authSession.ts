import axios from 'axios'

import { API_PREFIX } from '@propertypro/shared'
import { useAuthStore, type AuthUser } from '@/stores/authStore'

interface RefreshResponseData {
  accessToken: string
  user: AuthUser
}

let refreshPromise: Promise<RefreshResponseData | null> | null = null

async function rawRefresh(): Promise<RefreshResponseData | null> {
  try {
    const { data } = await axios.post<{ data: RefreshResponseData }>(
      `${API_PREFIX}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 5_000, // Reduced timeout
      },
    )
    return data.data
  } catch {
    // If there's no persisted user, mark as unauthenticated immediately
    if (!useAuthStore.getState().user) {
      useAuthStore.getState().signOut()
    }
    return null
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    const res = await refreshPromise
    return res?.accessToken ?? null
  }
  
  refreshPromise = rawRefresh()
  try {
    const res = await refreshPromise
    if (res) {
      useAuthStore.getState().signIn(res.user, res.accessToken)
      return res.accessToken
    } else {
      // Don't sign out automatically - keep local session
      return null
    }
  } finally {
    refreshPromise = null
  }
}

// Non-blocking restore - checks localStorage immediately, tries API in background
export function restoreSession(): Promise<boolean> {
  // Immediately return true if we have a persisted user
  const storedUser = useAuthStore.getState().user
  if (storedUser) {
    // Fire and forget API refresh in background
    refreshAccessToken().catch(() => {})
    return Promise.resolve(true)
  }
  
  // No local session - try API but with short timeout
  return refreshAccessToken().then(token => !!token).catch(() => false)
}

export async function logout(): Promise<void> {
  try {
    await axios.post(`${API_PREFIX}/auth/logout`, { allDevices: true }, { withCredentials: true })
  } catch {
    /* best-effort */
  }
  useAuthStore.getState().signOut()
}
