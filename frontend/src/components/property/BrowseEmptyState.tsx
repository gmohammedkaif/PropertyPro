import React from 'react'
import { SearchX, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface BrowseEmptyStateProps {
  onClearFilters: () => void
  hasActiveFilters?: boolean
}

export function BrowseEmptyState({
  onClearFilters,
  hasActiveFilters = true,
}: BrowseEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-border/80 bg-surface/40 backdrop-blur-xs animate-in fade-in-50 duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner mb-4">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-bold text-text tracking-tight">
        No properties found
      </h3>

      <p className="text-sm text-muted mt-1.5 max-w-md leading-relaxed">
        {hasActiveFilters
          ? "We couldn't find any properties matching your current filter criteria. Try adjusting your search query, property type, or price range."
          : 'There are currently no active properties listed in the marketplace.'}
      </p>

      {hasActiveFilters && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
