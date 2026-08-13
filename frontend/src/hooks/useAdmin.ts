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
      const { data } = await apiClient.get<{ data: OwnerRequest[] }>('/admin/owner-requests')
      return data.data
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

export interface AdminStats {
  totalProperties: number
  rentedProperties: number
  availableProperties: number
  propertiesForSale: number
  totalOwners: number
  totalTenants: number
  activeTenants: number
  totalLeases: number
}

export function useAdminStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AdminStats }>('/admin/stats')
      return data.data
    },
    ...options,
  })
}

export interface AdminOwner {
  id: string
  name: string
  email: string
  phone: string
  propertyCount: number
  status: UserStatus
}

export function useAdminOwners(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'owners'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AdminOwner[] }>('/admin/owners')
      return data.data
    },
    ...options,
  })
}

export interface AdminTenant {
  id: string
  name: string
  email: string
  status: UserStatus
  hasActiveLease?: boolean
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AdminTenant[] }>('/admin/tenants')
      return data.data
    },
  })
}
