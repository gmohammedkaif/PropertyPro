import { useMemo, useState, useEffect } from 'react'

import { useSearchParams } from 'react-router-dom'
import type { PropertyRecord } from '@/shared'

import { useLocalPropertiesStore, type LocalProperty } from '@/stores/localPropertiesStore'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 500

const SORT_MAP: Record<string, { sort: keyof LocalProperty; order: 'asc' | 'desc' }> = {
  newest: { sort: 'createdAt', order: 'desc' },
  oldest: { sort: 'createdAt', order: 'asc' },
  'name-asc': { sort: 'name', order: 'asc' },
  'name-desc': { sort: 'name', order: 'desc' },
}

export type ViewMode = 'table' | 'grid'

export interface LocalPropertyTableState {
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

function convertToPropertyRecord(p: LocalProperty): PropertyRecord {
  // Map LocalPropertyType to PropertyType (villa -> house)
  const propertyTypeMap: Record<string, PropertyRecord['type']> = {
    apartment: 'apartment',
    house: 'house',
    villa: 'house',
    resort: 'resort',
  }
  
  return {
    id: p.id,
    ownerId: 'local',
    name: p.name,
    type: propertyTypeMap[p.type] ?? 'house',
    address: p.address,
    description: p.description,
    totalUnits: p.totalUnits,
    occupiedUnits: p.occupiedUnits,
    status: 'active',
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
  }
}

export function useLocalPropertyTable(): LocalPropertyTableState {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [view, setView] = useState<ViewMode>('grid')
  const { items: allProperties } = useLocalPropertiesStore()

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

  // Filter and sort locally
  const { filteredItems, totalItems } = useMemo(() => {
    let items = [...allProperties]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      items = items.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.address.city.toLowerCase().includes(searchLower) ||
        p.address.line1.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower)
      )
    }

    // Type filter
    if (type) {
      items = items.filter(p => p.type === type)
    }

    // City filter
    if (city) {
      items = items.filter(p => p.address.city.toLowerCase().includes(city.toLowerCase()))
    }

    // Sort
    const sortConfig = SORT_MAP[sort] ?? SORT_MAP.newest
    items.sort((a, b) => {
      const aVal = a[sortConfig.sort]
      const bVal = b[sortConfig.sort]
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return 1
      if (bVal === undefined) return -1
      
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1
      return 0
    })

    const total = items.length
    const start = (currentPage - 1) * PAGE_SIZE
    const paginatedItems = items.slice(start, start + PAGE_SIZE)

    return { filteredItems: paginatedItems.map(convertToPropertyRecord), totalItems: total }
  }, [allProperties, search, type, city, sort, currentPage])

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
    data: filteredItems,
    isLoading: false,
    error: null,
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
    onRetry: () => {}, // No-op for local data
  }
}