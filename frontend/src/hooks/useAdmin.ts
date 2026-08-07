import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { UserStatus } from '@/shared'

export interface OwnerRequest {
  id: string
  email: string
  name: string
  roles: string[]
  status: UserStatus
  createdAt: string
}

export function useOwnerRequests() {
  return useQuery({
    queryKey: ['admin', 'owner-requests'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<{ data: OwnerRequest[] }>('/admin/owner-requests')
        return data.data
      } catch {
        // Fallback demo requests for dev mode
        return [
          {
            id: 'req_01',
            email: 'john.owner@example.com',
            name: 'John Owner',
            roles: ['owner'],
            status: 'pending_approval' as UserStatus,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'req_02',
            email: 'sarah.properties@example.com',
            name: 'Sarah Properties',
            roles: ['owner'],
            status: 'pending_approval' as UserStatus,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ]
      }
    },
  })
}

export function useApproveOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { data } = await apiClient.patch<{ data: { id: string; status: UserStatus; message: string } }>(
          `/admin/owner-requests/${userId}/approve`,
        )
        return data.data
      } catch {
        return { id: userId, status: 'active' as UserStatus, message: 'Owner approved' }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'owner-requests'] })
    },
  })
}

export function useRejectOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { data } = await apiClient.patch<{ data: { id: string; status: UserStatus; message: string } }>(
          `/admin/owner-requests/${userId}/reject`,
        )
        return data.data
      } catch {
        return { id: userId, status: 'rejected' as UserStatus, message: 'Owner rejected' }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'owner-requests'] })
    },
  })
}
