import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

import type { ApiEnvelope } from '@/lib/apiClient'
import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from '@propertypro/shared'

// Query keys for property-related queries
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filter: PropertyFilter) => [...propertyKeys.lists(), filter] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
}

// TanStack Query hooks for properties
export function useProperties(filter?: PropertyFilter) {
  return useQuery({
    queryKey: propertyKeys.list(filter ?? {}),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties', {
        params: filter,
      })
      if (!data.data) throw new Error('Malformed properties response')
      return data.data
    },
    enabled: !!filter,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useProperty(id: string, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<PropertyRecord>>(`/properties/${id}`)
      if (!data.data) throw new Error('Malformed property response')
      return data.data
    },
    enabled: enabled && !!id,
    staleTime: 60_000,
    retry: 2,
  })
}

export function useSearchProperties(query?: string, filter?: PropertyFilter) {
  return useQuery({
    queryKey: [...propertyKeys.all, 'search', query, filter],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties/search', {
        params: { q: query, ...filter },
      })
      if (!data.data) throw new Error('Malformed search response')
      return data.data
    },
    enabled: !!query,
    staleTime: 15_000,
    retry: 1,
  })
}

// Reusable mutations
export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const { data } = await apiClient.post<ApiEnvelope<PropertyRecord>>('/properties', input)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
    retry: false, // Do NOT retry on failure — prevents cascading 429s
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdatePropertyInput }) => {
      const { data } = await apiClient.patch<ApiEnvelope<PropertyRecord>>(`/properties/${id}`, input)
      return data.data!
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    retry: false,
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiEnvelope<PropertyRecord>>(`/properties/${id}`)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    retry: false,
  })
}

export function useRestoreProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiEnvelope<PropertyRecord>>(`/properties/${id}/restore`)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    retry: false,
  })
}
