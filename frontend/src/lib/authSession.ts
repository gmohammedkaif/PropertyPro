import axios from 'axios'

import { API_PREFIX } from '@/shared'
import { baseURL } from '@/lib/apiClient'
import { useAuthStore, type AuthUser } from '@/stores/authStore'

interface RefreshResponseData {
  accessToken: string
  user: AuthUser
}

let refreshPromise: Promise<RefreshResponseData | null> | null = null

async function rawRefresh(): Promise<RefreshResponseData | null> {
  try {
    const { data } = await axios.post<{ data: RefreshResponseData }>(
      `${baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10_000,
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
      useAuthStore.getState().signOut()
      return null
    }
  } finally {
    refreshPromise = null
  }
}

export async function restoreSession(): Promise<boolean> {
  try {
    const token = await refreshAccessToken()
    if (token) return true
    useAuthStore.getState().signOut()
    return false
  } catch {
    useAuthStore.getState().signOut()
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await axios.post(`${API_PREFIX}/auth/logout`, { allDevices: true }, { withCredentials: true })
  } catch {
    /* best-effort */
  }
  useAuthStore.getState().signOut()
}
