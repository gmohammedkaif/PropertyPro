import { useQuery } from '@tanstack/react-query'

import { apiClient, type ApiEnvelope } from '@/lib/apiClient'

export interface HealthData {
  status: string
  name: string
  service: string
  version: string
  apiVersion: string
  uptime: number
  timestamp: string
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiEnvelope<HealthData>>('/health')
      if (!data.data) {
        throw new Error('Malformed health response.')
      }
      return data.data
    },
    retry: 1,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
