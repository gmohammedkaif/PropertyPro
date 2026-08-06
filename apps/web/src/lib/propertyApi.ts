import { apiClient } from '@/lib/apiClient'

import type { ApiEnvelope } from '@/lib/apiClient'
import type {
  PropertyRecord,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilter,
  PropertyListResult,
} from '@propertypro/shared'

export async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.request<T>({ method, url, data: body })
  return data
}

export async function getProperties(filter?: Partial<PropertyFilter>): Promise<PropertyListResult> {
  const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties', {
    params: filter,
  })
  return data.data!
}

export async function searchProperties(query?: string, filter?: Partial<PropertyFilter>): Promise<PropertyListResult> {
  const { data } = await apiClient.get<ApiEnvelope<PropertyListResult>>('/properties/search', {
    params: { q: query, ...filter },
  })
  return data.data!
}

export async function getProperty(id: string): Promise<PropertyRecord> {
  const { data } = await apiClient.get<ApiEnvelope<PropertyRecord>>(`/properties/${id}`)
  return data.data!
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyRecord> {
  const { data } = await apiClient.post<ApiEnvelope<PropertyRecord>>('/properties', input)
  return data.data!
}

export async function updateProperty(id: string, input: UpdatePropertyInput): Promise<PropertyRecord> {
  const { data } = await apiClient.patch<ApiEnvelope<PropertyRecord>>(`/properties/${id}`, input)
  return data.data!
}

export async function deleteProperty(id: string): Promise<PropertyRecord> {
  const { data } = await apiClient.delete<ApiEnvelope<PropertyRecord>>(`/properties/${id}`)
  return data.data!
}

export async function restoreProperty(id: string): Promise<PropertyRecord> {
  const { data } = await apiClient.post<ApiEnvelope<PropertyRecord>>(`/properties/${id}/restore`)
  return data.data!
}
