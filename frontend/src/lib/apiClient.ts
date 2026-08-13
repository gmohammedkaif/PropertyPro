import { API_PREFIX } from '@/shared'
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/stores/authStore'

/** Standard API envelope — mirrors `docs/API.md`. */
export interface ApiEnvelope<T> {
  data: T | null
  meta: Record<string, unknown>
  error: { code: string; message: string } | null
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, code = 'INTERNAL', details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/** Prefer VITE_API_URL when pointed at a deployed API; otherwise use the same-origin dev proxy. */
export const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || API_PREFIX

export const apiClient = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(err: unknown, token: string | null) {
  for (const { resolve, reject } of failedQueue) {
    if (err) reject(err)
    else resolve(token!)
  }
  failedQueue = []
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url ?? ''
      if (url.includes('/auth/refresh')) {
        useAuthStore.getState().signOut()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.set('Authorization', `Bearer ${token}`)
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post<{ data: { accessToken: string } }>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10_000 },
        )
        const newToken = data.data.accessToken
        const currentUser = useAuthStore.getState().user
        if (currentUser) useAuthStore.getState().signIn(currentUser, newToken)
        processQueue(null, newToken)
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        useAuthStore.getState().signOut()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const data = error.response?.data
    const message = data?.error?.message ?? error.message ?? 'Something went wrong'
    return Promise.reject(
      new ApiError(
        message,
        error.response?.status ?? 0,
        data?.error?.code ?? 'INTERNAL',
        data?.error,
      ),
    )
  },
)
