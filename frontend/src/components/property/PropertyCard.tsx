import React, { memo } from 'react'
import { MapPin, Key, Bath, Square, Heart, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PropertyImage } from './PropertyImage'
import { useSavedPropertiesStore } from '@/stores/savedPropertiesStore'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export interface PropertyCardItem {
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
  status?: 'available' | 'occupied' | 'inactive'
}

export interface PropertyCardProps {
  item: PropertyCardItem
  onClick: (id: string) => void
  priority?: boolean
}

function formatRupee(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export const PropertyCard = memo(function PropertyCard({
  item,
  onClick,
  priority = false,
}: PropertyCardProps) {
  const toast = useToast()
  const isSaved = useSavedPropertiesStore((state) => state.savedIds.includes(item.id))
  const toggleSave = useSavedPropertiesStore((state) => state.toggleSave)

  const handleToggleFavorite = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    const savedNow = toggleSave(item.id)
    if (savedNow) {
      toast.success('Property Saved', {
        description: `"${item.name}" added to your saved favorites.`,
      })
    } else {
      toast.info('Property Removed', {
        description: `"${item.name}" removed from your favorites.`,
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(item.id)
    }
  }

  const isSale = item.listingType === 'sale'
  const isAvailable = item.status !== 'occupied' && item.status !== 'inactive'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item.id)}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-border/70 bg-surface/70 shadow-xs hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* ─── Media Area ────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-surface2">
        <PropertyImage
          src={item.imageUrl}
          alt={item.name}
          aspectRatio="16/10"
          priority={priority}
          imageClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Dark Gradient for Contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30 group-hover:from-black/80 transition-colors" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 z-10 pointer-events-none">
          <Badge intent={isAvailable ? 'success' : 'neutral'} size="sm" className="shadow-xs font-semibold backdrop-blur-md">
            {isAvailable ? 'Available' : 'Occupied'}
          </Badge>
          <Badge intent="neutral" size="sm" className="shadow-xs font-semibold backdrop-blur-md bg-black/40 text-white border-white/10">
            {isSale ? 'For Sale' : 'For Rent'}
          </Badge>
        </div>

        {/* Top-Right Favorite Button */}
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isSaved ? `Remove ${item.name} from saved properties` : `Save ${item.name} to favorites`}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isSaved
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 hover:bg-rose-500/30 active:scale-90'
                : 'bg-black/40 text-white border border-white/10 hover:bg-black/60 hover:text-rose-400 active:scale-90'
            )}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white group-hover:scale-105'
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Bottom Price Banner */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 text-white flex items-baseline justify-between">
          <p className="text-lg sm:text-xl font-extrabold font-display tracking-tight text-white drop-shadow-sm">
            {item.price > 0 ? formatRupee(item.price) : 'Price on Request'}
            {item.price > 0 && !isSale && (
              <span className="text-xs font-normal text-white/80 ml-1">/month</span>
            )}
          </p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            View <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* ─── Content Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="font-display text-base font-bold text-text group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
            {item.name}
          </h3>

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 text-primary/80 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.city || 'Location on Request'}</span>
          </p>

          {item.description && (
            <p className="text-xs text-text2/80 line-clamp-2 leading-relaxed pt-1">
              {item.description}
            </p>
          )}
        </div>

        {/* ─── Features / Specs Bar ────────────────────────────────────────── */}
        <div className="mt-2 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs text-muted">
          <div className="flex items-center gap-1.5 truncate" title={`${item.bedrooms ?? 'N/A'} Bedrooms`}>
            <Key className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">
              {item.bedrooms !== undefined && item.bedrooms !== null ? `${item.bedrooms} BHK` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate" title={`${item.bathrooms ?? 'N/A'} Bathrooms`}>
            <Bath className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">
              {item.bathrooms !== undefined && item.bathrooms !== null ? `${item.bathrooms} Bath` : '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate" title={`${item.areaSqFt ? item.areaSqFt.toLocaleString() : 'N/A'} sq ft`}>
            <Square className="h-3.5 w-3.5 text-primary/70 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">
              {item.areaSqFt ? `${item.areaSqFt.toLocaleString()} sq ft` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
