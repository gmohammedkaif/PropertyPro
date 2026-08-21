import { useState, useMemo, useEffect } from 'react'
import { Search, Filter, MapPin, Key, Bath, Square, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassCard, GlassCardContent } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useAuthStore } from '@/stores/authStore'

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House/Villa' },
  { value: 'resort', label: 'Resort' },
]

const BEDROOM_OPTIONS: SelectOption[] = [
  { value: '', label: 'Any BHK' },
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4+ BHK' },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'area-desc', label: 'Largest First' },
]

export function BrowsePage() {
  const navigate = useNavigate()
  const { items: properties, fetch: fetchProperties } = useLocalPropertiesStore()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [bedroomFilter, setBedroomFilter] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Get active properties for marketplace from MongoDB
  const allListings = useMemo(() => {
    return properties
      .filter(p => p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale')
      .map(p => ({
        id: p.id,
        name: p.name,
        price: p.listingStatus === 'for-sale' ? (p.salePrice || 0) : (p.monthlyRent || 0),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqFt: p.areaSqFt,
        description: p.description,
        type: 'local' as const,
        listingType: p.listingStatus === 'for-sale' ? ('sale' as const) : ('rent' as const),
        status: 'available' as const,
        city: p.address.city,
        imageUrl: p.imageUrl,
      }))
  }, [properties])

  // Filter listings
  const filteredListings = useMemo(() => {
    return allListings.filter(item => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(searchLower)
        const matchesCity = item.city.toLowerCase().includes(searchLower)
        const matchesDesc = item.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesCity && !matchesDesc) return false
      }

      // Type filter
      if (typeFilter) {
        // For local properties, map their type
        if (item.type === 'local') {
          const prop = properties.find(p => p.id === item.id)
          if (prop?.type !== typeFilter) return false
        }
      }

      // Bedroom filter
      if (bedroomFilter) {
        if (item.bedrooms === undefined || item.bedrooms === null) return false
        if (bedroomFilter === '4') {
          if (item.bedrooms < 4) return false
        } else if (item.bedrooms !== parseInt(bedroomFilter)) {
          return false
        }
      }

      // Price filter
      if (item.price > 0) {
        if (item.price < priceRange[0]) return false
        if (priceRange[1] < 100000 && item.price > priceRange[1]) return false
      }

      return true
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 999999) - (b.price || 999999)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
        case 'area-desc':
          return (b.areaSqFt || 0) - (a.areaSqFt || 0)
        case 'newest':
        default:
          return 0 // Keep original order
      }
    })
  }, [allListings, search, typeFilter, bedroomFilter, priceRange, sortBy, properties])

  const handleViewDetail = (id: string) => {
    navigate(user ? `/app/property/${id}` : `/browse/${id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Browse Properties</h1>
          <p className="text-sm text-muted mt-0.5">
            Find your next home from {allListings.length} available propert{allListings.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Sidebar */}
      {showFilters && (
        <GlassCard className="p-0 overflow-hidden">
          <GlassCardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between gap-4">
              <Input
                placeholder="Search by name, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="flex-1 max-w-xs"
              />
              <Select
                placeholder="Property Type"
                options={TYPE_OPTIONS}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-48"
              />
              <Select
                placeholder="Bedrooms"
                options={BEDROOM_OPTIONS}
                value={bedroomFilter}
                onChange={(e) => setBedroomFilter(e.target.value)}
                className="w-full sm:w-40"
              />
              <Select
                placeholder="Sort By"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-44"
              />
              <Button variant="secondary" onClick={() => {
                setSearch('')
                setTypeFilter('')
                setBedroomFilter('')
                setPriceRange([0, 100000])
                setSortBy('newest')
              }}>
                Clear All
              </Button>
            </div>
            
            {/* Price Range Slider */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">Price Range</span>
                <span className="font-medium text-text">
                  {priceRange[0] === 0 ? 'No Min' : formatRupee(priceRange[0])} - 
                  {priceRange[1] >= 100000 ? 'No Max' : formatRupee(priceRange[1])}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="5000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="flex-1 accent-primary"
                />
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="5000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-1 accent-primary"
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Results */}
      <GlassCard className="p-0">
        <GlassCardContent className="p-0">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-text">No properties found</h3>
              <p className="text-sm text-muted mt-1">Try adjusting your filters or search terms</p>
              <Button variant="secondary" className="mt-4" onClick={() => {
                setSearch('')
                setTypeFilter('')
                setBedroomFilter('')
                setPriceRange([0, 100000])
                setSortBy('newest')
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  onClick={handleViewDetail}
                />
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* CTA for non-logged in users */}
      {!user && (
        <GlassCard variant="primary" className="text-center py-10">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-text">Looking to list your property?</h3>
            <p className="text-sm text-muted mt-2">Sign up as a property owner to list your properties and find tenants.</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button variant="primary" onClick={() => navigate('/register')}>
                Register as Owner
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

interface ListingCardProps {
  item: {
    id: string
    name: string
    price: number
    bedrooms?: number
    bathrooms?: number
    areaSqFt?: number
    description?: string
    type: 'listing' | 'local'
    city: string
    imageUrl?: string
    listingType?: 'rent' | 'sale'
  }
  onClick: (id: string) => void
}

function ListingCard({ item, onClick }: ListingCardProps) {
  return (
    <div
      className="group flex flex-col h-full overflow-hidden border-r border-b border-border/50 last:border-r-0 sm:last:border-r border-r transition-all duration-300 hover:bg-surface/50 cursor-pointer"
      onClick={() => onClick(item.id)}
    >
      {/* Image Header */}
      <div className="relative h-48 w-full bg-surface2 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted/50">
              <div className="text-5xl mb-1">🏠</div>
              <p className="text-sm font-medium">{item.name}</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/60 transition-colors" />
        
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge intent="success" size="sm">Available</Badge>
          <Badge intent="neutral" size="sm">{item.listingType === 'sale' ? 'For Sale' : 'For Rent'}</Badge>
        </div>
        
        <div className="absolute right-3 top-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Save property"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-xl font-bold font-display">
            {item.price > 0 ? formatRupee(item.price) : 'Not specified'} 
            {item.price > 0 && item.listingType !== 'sale' && <span className="text-base font-normal opacity-80">/month</span>}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
          {item.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{item.city}</span>
        </p>
        {item.description && (
          <p className="mt-2 text-sm text-text2 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}
        
        {/* Features */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-border/50">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Key className="h-3 w-3" aria-hidden="true" />
            {item.bedrooms !== undefined && item.bedrooms !== null ? `${item.bedrooms} BHK` : 'Not specified'}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Bath className="h-3 w-3" aria-hidden="true" />
            {item.bathrooms !== undefined && item.bathrooms !== null ? `${item.bathrooms} Bath` : 'Not specified'}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Square className="h-3 w-3" aria-hidden="true" />
            {item.areaSqFt !== undefined && item.areaSqFt !== null ? `${item.areaSqFt.toLocaleString()} sq ft` : 'Not specified'}
          </span>
        </div>
      </div>
    </div>
  )
}