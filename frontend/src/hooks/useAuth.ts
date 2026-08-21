import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthUser } from '@/stores/authStore'

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.request<T>({ method, url, data: body })
  return data
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await apiClient.post<{ data: { accessToken: string; user: AuthUser } }>('/auth/login', input)
      if (!data.data) {
        throw new Error('Authentication failed: Invalid server response')
      }
      return data.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().signIn(data.user, data.accessToken)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: {
      email: string
      password: string
      username?: string
      firstName?: string
      lastName?: string
      role?: string
    }) => {
      const { data } = await apiClient.post<{
        data: { accessToken: string | null; user: AuthUser; pendingApproval?: boolean; message?: string }
      }>('/auth/register', input)
      if (!data.data) {
        throw new Error('Registration failed: Invalid server response')
      }
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
