import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Building,
  Check,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassCard, GlassCardContent } from '@/components/ui/GlassCard'
import { Select, type SelectOption } from '@/components/ui/Select'
import { PropertyCard, type PropertyCardItem } from '@/components/property/PropertyCard'
import { PropertyGridSkeleton } from '@/components/property/PropertyCardSkeleton'
import { BrowseEmptyState } from '@/components/property/BrowseEmptyState'
import { BrowseErrorState } from '@/components/property/BrowseErrorState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

import { useLocalPropertiesStore, type LocalProperty } from '@/stores/localPropertiesStore'
import { useAuthStore } from '@/stores/authStore'

function formatRupee(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Property Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House / Villa' },
  { value: 'resort', label: 'Resort' },
]

const BEDROOM_OPTIONS: SelectOption[] = [
  { value: '', label: 'Any Bedrooms (BHK)' },
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4+ BHK' },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'area-desc', label: 'Largest Area First' },
]

const MAX_PRICE_SLIDER = 100000

export function BrowsePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => (state.status === 'authenticated' ? state.user : null))

  const {
    items: properties,
    isLoading,
    error,
    fetch: fetchProperties,
  } = useLocalPropertiesStore()

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Filter state initialized from URL query params if present (e.g. from global search)
  const [search, setSearch] = useState<string>(searchParams.get('q') || '')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [bedroomFilter, setBedroomFilter] = useState<string>('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE_SLIDER])
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState<boolean>(false)

  // Sync URL query if changed from navbar
  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null && q !== search) {
      setSearch(q)
    }
  }, [searchParams])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (search.trim()) count++
    if (typeFilter) count++
    if (bedroomFilter) count++
    if (priceRange[0] > 0 || priceRange[1] < MAX_PRICE_SLIDER) count++
    if (sortBy !== 'newest') count++
    return count
  }, [search, typeFilter, bedroomFilter, priceRange, sortBy])

  // Map backend property records into standard marketplace items
  const allListings = useMemo<PropertyCardItem[]>(() => {
    return properties
      .filter((p) => p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale')
      .map((p) => ({
        id: p.id,
        name: p.name,
        price:
          p.listingStatus === 'for-sale'
            ? p.salePrice || 0
            : p.monthlyRent || 0,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqFt: p.areaSqFt,
        description: p.description,
        type: 'local',
        listingType: p.listingStatus === 'for-sale' ? 'sale' : 'rent',
        status: p.listingStatus === 'occupied' ? 'occupied' : 'available',
        city: p.address?.city || 'Location unavailable',
        imageUrl: p.imageUrl || (p.images && p.images[0]) || undefined,
      }))
  }, [properties])

  // Filter & sort listings with fast memoized evaluation
  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase()
    const isFiltered = allListings.filter((item) => {
      // 1. Text Search Filter
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query)
        const matchesCity = item.city.toLowerCase().includes(query)
        const matchesDesc = item.description?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesCity && !matchesDesc) return false
      }

      // 2. Property Type Filter
      if (typeFilter) {
        const originalProp = properties.find((p) => p.id === item.id)
        if (originalProp?.type !== typeFilter) return false
      }

      // 3. Bedroom Filter
      if (bedroomFilter) {
        if (item.bedrooms === undefined || item.bedrooms === null) return false
        if (bedroomFilter === '4') {
          if (item.bedrooms < 4) return false
        } else if (item.bedrooms !== parseInt(bedroomFilter, 10)) {
          return false
        }
      }

      // 4. Price Range Filter
      if (item.price > 0) {
        if (item.price < priceRange[0]) return false
        if (priceRange[1] < MAX_PRICE_SLIDER && item.price > priceRange[1]) return false
      }

      return true
    })

    // Sort evaluation
    return isFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 999999) - (b.price || 999999)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
        case 'area-desc':
          return (b.areaSqFt || 0) - (a.areaSqFt || 0)
        case 'newest':
        default:
          return 0
      }
    })
  }, [allListings, search, typeFilter, bedroomFilter, priceRange, sortBy, properties])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setTypeFilter('')
    setBedroomFilter('')
    setPriceRange([0, MAX_PRICE_SLIDER])
    setSortBy('newest')
  }, [])

  const handleViewDetail = useCallback(
    (id: string) => {
      navigate(user ? `/app/property/${id}` : `/browse/${id}`)
    },
    [navigate, user]
  )

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-12 animate-in fade-in-50 duration-300">
      {/* ─── 1. Header Section ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
              Browse Properties
            </h1>
            {isLoading && properties.length === 0 && (
              <LoadingSpinner size="sm" className="text-primary ml-1" />
            )}
          </div>
          <p className="text-sm text-muted">
            {isLoading && properties.length === 0 ? (
              'Fetching current marketplace listings from server...'
            ) : activeFiltersCount > 0 ? (
              <span>
                Showing <strong className="text-text font-semibold">{filteredListings.length}</strong> of{' '}
                <strong className="text-text font-semibold">{allListings.length}</strong> properties matching your filters
              </span>
            ) : (
              <span>
                Find your next home from{' '}
                <strong className="text-text font-semibold">{allListings.length}</strong> verified available propert
                {allListings.length === 1 ? 'y' : 'ies'}
              </span>
            )}
          </p>
        </div>

        {/* Filter Drawer Toggle & Quick Actions */}
        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}

          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 shadow-xs transition-all duration-200"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                showFilters ? 'rotate-90 text-white' : 'text-primary'
              )}
              aria-hidden="true"
            />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ml-0.5',
                  showFilters
                    ? 'bg-white text-primary'
                    : 'bg-primary text-white shadow-xs'
                )}
              >
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ─── 2. Search & Filter Panel ──────────────────────────────────────── */}
      {showFilters && (
        <GlassCard className="p-0 overflow-hidden border-border/80 shadow-md animate-in fade-in-50 slide-in-from-top-3 duration-250">
          <GlassCardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
              {/* Text Search Input */}
              <div className="relative flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
                  Keyword / Location
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="City, locality, or property..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-9 py-2 text-sm text-text placeholder:text-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 text-muted hover:text-text p-0.5 rounded transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Property Type Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
                  Property Type
                </label>
                <Select
                  placeholder="All Types"
                  options={TYPE_OPTIONS}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Bedrooms Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
                  Bedrooms
                </label>
                <Select
                  placeholder="Any BHK"
                  options={BEDROOM_OPTIONS}
                  value={bedroomFilter}
                  onChange={(e) => setBedroomFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Sort By Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
                  Sort Order
                </label>
                <Select
                  placeholder="Sort by"
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="pt-4 border-t border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  Monthly Budget / Price Range
                </span>
                <span className="font-bold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {priceRange[0] === 0 ? 'No Min' : formatRupee(priceRange[0])} —{' '}
                  {priceRange[1] >= MAX_PRICE_SLIDER ? 'No Max' : formatRupee(priceRange[1])}
                </span>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <input
                  type="range"
                  min="0"
                  max={MAX_PRICE_SLIDER}
                  step="5000"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const nextVal = parseInt(e.target.value, 10)
                    setPriceRange([Math.min(nextVal, priceRange[1]), priceRange[1]])
                  }}
                  className="flex-1 accent-primary h-1.5 bg-surface2 rounded-lg cursor-pointer"
                  aria-label="Minimum price filter"
                />
                <input
                  type="range"
                  min="0"
                  max={MAX_PRICE_SLIDER}
                  step="5000"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const nextVal = parseInt(e.target.value, 10)
                    setPriceRange([priceRange[0], Math.max(nextVal, priceRange[0])])
                  }}
                  className="flex-1 accent-primary h-1.5 bg-surface2 rounded-lg cursor-pointer"
                  aria-label="Maximum price filter"
                />
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40 text-xs">
                <span className="text-muted font-medium">Active:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-text border border-border/60">
                    Query: &quot;{search}&quot;
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="text-muted hover:text-text ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {typeFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-text border border-border/60 capitalize">
                    {typeFilter}
                    <button
                      type="button"
                      onClick={() => setTypeFilter('')}
                      className="text-muted hover:text-text ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {bedroomFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-text border border-border/60">
                    {bedroomFilter === '4' ? '4+ BHK' : `${bedroomFilter} BHK`}
                    <button
                      type="button"
                      onClick={() => setBedroomFilter('')}
                      className="text-muted hover:text-text ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(priceRange[0] > 0 || priceRange[1] < MAX_PRICE_SLIDER) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-text border border-border/60">
                    Price: {priceRange[0] > 0 ? formatRupee(priceRange[0]) : '0'} -{' '}
                    {priceRange[1] < MAX_PRICE_SLIDER ? formatRupee(priceRange[1]) : 'Max'}
                    <button
                      type="button"
                      onClick={() => setPriceRange([0, MAX_PRICE_SLIDER])}
                      className="text-muted hover:text-text ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* ─── 3. Main Content: Skeletons / Error / Empty / Grid ──────────────── */}
      {error && properties.length === 0 ? (
        <BrowseErrorState
          error={error}
          onRetry={fetchProperties}
          isRetrying={isLoading}
        />
      ) : isLoading && properties.length === 0 ? (
        <PropertyGridSkeleton count={6} />
      ) : filteredListings.length === 0 ? (
        <BrowseEmptyState
          onClearFilters={handleClearFilters}
          hasActiveFilters={activeFiltersCount > 0}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((item, index) => (
            <PropertyCard
              key={item.id}
              item={item}
              onClick={handleViewDetail}
              priority={index < 3}
            />
          ))}
        </div>
      )}

      {/* ─── 4. Onboarding Banner for Guests ───────────────────────────────── */}
      {!user && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 via-surface/80 to-surface/40 p-8 sm:p-10 text-center shadow-lg backdrop-blur-md mt-6">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
              <Building className="h-3.5 w-3.5" />
              <span>For Property Owners & Landlords</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Looking to list and manage your properties?
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Join PropertyPro to publish listings, manage multi-unit occupancies, receive verified rental applications, and automate lease payments.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/register')}
                className="shadow-md hover:shadow-lg"
              >
                Register as Owner
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}