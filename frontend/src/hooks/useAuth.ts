import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthUser, demoTenant } from '@/stores/authStore'
import { demoUser } from '@/stores/authStore'

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.request<T>({ method, url, data: body })
  return data
}

// Demo credentials for offline testing
const DEMO_CREDENTIALS = {
  'alex@propertypro.app': { user: demoUser, password: 'demo1234' },
  'tenant@propertypro.app': { user: demoTenant, password: 'demo1234' },
}

function tryDemoLogin(input: { email: string; password: string }) {
  const demo = DEMO_CREDENTIALS[input.email as keyof typeof DEMO_CREDENTIALS]
  if (demo && demo.password === input.password) {
    return { user: demo.user, accessToken: 'demo-token' }
  }
  return null
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      try {
        const { data } = await apiClient.post<{ data: { accessToken: string; user: AuthUser } }>('/auth/login', input)
        return data.data
      } catch (err) {
        // Fallback to demo login
        const demoResult = tryDemoLogin(input)
        if (demoResult) return demoResult
        throw err
      }
    },
    onSuccess: (data) => {
      useAuthStore.getState().signIn(data.user, data.accessToken)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string; username?: string; firstName?: string; lastName?: string; role?: string }) => {
      const { data } = await apiClient.post<{ data: { accessToken: string | null; user: AuthUser; pendingApproval?: boolean; message?: string } }>('/auth/register', input)
      return data.data
    },
    onSuccess: (data) => {
      if (!data.pendingApproval && data.accessToken && data.user) {
        useAuthStore.getState().signIn(data.user, data.accessToken)
      }
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => request<void>('POST', '/auth/logout', { allDevices: true }),
    onSuccess: () => {
      useAuthStore.getState().signOut()
      queryClient.clear()
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const { data } = await apiClient.post<{ data: null; meta: { resetToken?: string } }>('/auth/forgot-password', input)
      return data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; password: string }) => {
      const { data } = await apiClient.post<{ data: null }>('/auth/reset-password', input)
      return data
    },
  })
}

export function useAuthMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AuthUser }>('/auth/me')
      if (!data.data) throw new Error('Malformed auth response')
      return data.data
    },
    staleTime: 30_000,
    retry: 1,
  })
}
