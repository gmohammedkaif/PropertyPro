import { useMemo, useState, useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import type { PropertyFilter, PropertyRecord } from '@/shared'

import { useProperties } from '@/hooks/useProperty'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 500

const STATUS_MAP: Record<string, 'active' | 'archived' | undefined> = {
  all: undefined,
  active: 'active',
  archived: 'archived',
}

const SORT_MAP: Record<string, { sort: string; order: 'asc' | 'desc' }> = {
  newest: { sort: 'createdAt', order: 'desc' },
  oldest: { sort: 'createdAt', order: 'asc' },
  'name-asc': { sort: 'name', order: 'asc' },
  'name-desc': { sort: 'name', order: 'desc' },
}

export type ViewMode = 'table' | 'grid'

export interface PropertyTableState {
  searchInput: string
  setSearchInput: (value: string) => void
  status: string
  type: string
  city: string
  sort: string
  view: ViewMode
  currentPage: number
  totalPages: number
  totalItems: number
  data: PropertyRecord[]
  isLoading: boolean
  error: Error | null
  setStatus: (value: string) => void
  setType: (value: string) => void
  setCity: (value: string) => void
  setSort: (value: string) => void
  setPage: (page: number) => void
  setView: (value: ViewMode) => void
  resetFilters: () => void
  onRetry: () => void
}

export function usePropertyTable(): PropertyTableState {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [view, setView] = useState<ViewMode>('grid')

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const type = searchParams.get('type') ?? ''
  const city = searchParams.get('city') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        const params = new URLSearchParams(searchParams)
        if (searchInput) {
          params.set('search', searchInput)
        } else {
          params.delete('search')
        }
        params.set('page', '1')
        setSearchParams(params, { replace: true })
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handler)
  }, [searchInput, search, searchParams, setSearchParams])

  const filter = useMemo<PropertyFilter>(() => {
    const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest
    const statusValue = STATUS_MAP[status]

    const result: PropertyFilter = {
      sort: sortConfig.sort,
      order: sortConfig.order,
      limit: PAGE_SIZE,
    }

    if (search) result.search = search
    if (type) result.type = type as PropertyFilter['type']
    if (statusValue) result.status = statusValue
    if (city) result.city = city
    if (currentPage > 1) result.cursor = String((currentPage - 1) * PAGE_SIZE)

    return result
  }, [search, status, type, city, sort, currentPage])

  const { data, isLoading, error, refetch } = useProperties(filter)

  const totalItems = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const resetFilters = () => {
    setSearchParams({}, { replace: true })
    setSearchInput('')
    setView('grid')
  }

  return {
    searchInput,
    setSearchInput,
    status,
    type,
    city,
    sort,
    view,
    currentPage,
    totalPages,
    totalItems,
    data: data?.items ?? [],
    isLoading,
    error: error ? (error as Error) : null,
    setStatus: (value: string) => updateParam('status', value),
    setType: (value: string) => updateParam('type', value),
    setCity: (value: string) => updateParam('city', value),
    setSort: (value: string) => updateParam('sort', value),
    setPage: (page: number) => {
      const params = new URLSearchParams(searchParams)
      params.set('page', String(page))
      setSearchParams(params)
    },
    setView,
    resetFilters,
    onRetry: () => refetch(),
  }
}
