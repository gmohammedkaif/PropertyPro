import { LayoutGrid, LayoutList, RotateCcw, Search } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { type SelectOption, Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import type { ViewMode } from '@/hooks/usePropertyTable'

const statusOptions: SelectOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const typeOptions: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'resort', label: 'Resort' },
]

const sortOptions: SelectOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
]

export interface PropertyToolbarProps {
  search: string
  status: string
  type: string
  city: string
  sort: string
  view: ViewMode
  onSearch: (value: string) => void
  onStatusChange: (value: string) => void
  onTypeChange: (value: string) => void
  onCityChange: (value: string) => void
  onSortChange: (value: string) => void
  onViewChange: (value: ViewMode) => void
  onReset: () => void
}

export function PropertyToolbar({
  search,
  status,
  type,
  city: _city,
  sort,
  view,
  onSearch,
  onStatusChange,
  onTypeChange,
  onCityChange: _onCityChange,
  onSortChange,
  onViewChange,
  onReset,
}: PropertyToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search properties..."
            value={search}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <Toggle
          options={[
            { value: 'table', label: 'Table View', icon: <LayoutList className="h-4 w-4" aria-hidden="true" /> },
            { value: 'grid', label: 'Grid View', icon: <LayoutGrid className="h-4 w-4" aria-hidden="true" /> },
          ]}
          value={view}
          onChange={(value) => onViewChange(value as ViewMode)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-1 sm:flex-row sm:gap-3">
          <Select
            placeholder="All Status"
            options={statusOptions}
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          />
          <Select
            placeholder="All Types"
            options={typeOptions}
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          />
          <Select
            placeholder="Sort by"
            options={sortOptions}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          />
        </div>

        <Button variant="secondary" size="md" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset Filters
        </Button>
      </div>
    </div>
  )
}
