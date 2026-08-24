import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface BrowseErrorStateProps {
  error?: string | null
  onRetry: () => void
  isRetrying?: boolean
}

export function BrowseErrorState({
  error,
  onRetry,
  isRetrying = false,
}: BrowseErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-danger/30 bg-danger-soft/15 backdrop-blur-xs animate-in fade-in-50 duration-300">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20 mb-4">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-bold text-text tracking-tight">
        Unable to load properties
      </h3>

      <p className="text-sm text-muted mt-1.5 max-w-md leading-relaxed">
        {error || "We couldn't load the property listings right now. Please check your network connection and try again."}
      </p>

      <div className="mt-6">
        <Button
          variant="secondary"
          onClick={onRetry}
          loading={isRetrying}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
