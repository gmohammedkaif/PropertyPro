import React, { useState, useEffect } from 'react'
import { Building2, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PropertyImageProps {
  src?: string | null
  alt: string
  aspectRatio?: '16/10' | '16/9' | '4/3' | '1/1' | 'auto'
  className?: string
  imageClassName?: string
  priority?: boolean
  sizes?: string
}

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  'auto': '',
}

export function PropertyImage({
  src,
  alt,
  aspectRatio = '16/10',
  className,
  imageClassName,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: PropertyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Reset states if src prop changes
  useEffect(() => {
    setIsLoaded(false)
    setHasError(!src || src.trim() === '')
  }, [src])

  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio] ?? 'aspect-[16/10]'

  if (hasError || !src || src.trim() === '') {
    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-surface2 to-surface3 text-muted selection:bg-transparent',
          aspectClass,
          className
        )}
        aria-label={`${alt} (Image unavailable)`}
      >
        <div className="flex flex-col items-center gap-1.5 p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface/60 border border-border/40 text-muted/80 shadow-xs">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-[11px] font-medium text-muted/70 tracking-tight line-clamp-1 max-w-[180px]">
            {alt || 'Property Preview'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface2',
        aspectClass,
        className
      )}
    >
      {/* Shimmer skeleton while image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface3 animate-pulse">
          <div
            className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ transform: 'translateX(-100%)' }}
          />
        </div>
      )}

      {/* Main Image */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          'h-full w-full object-cover transition-all duration-500 ease-out',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]',
          imageClassName
        )}
      />
    </div>
  )
}
