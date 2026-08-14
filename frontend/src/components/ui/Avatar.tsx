import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
      ring: {
        true: 'ring-2 ring-border',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      ring: false,
    },
  },
)

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string
  status?: 'online' | 'offline' | 'away'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, src, size, ring, status, className }: AvatarProps) {
  const statusColor =
    status === 'online' ? 'bg-success' : status === 'away' ? 'bg-warning' : 'bg-muted'

  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        avatarVariants({ size, ring }),
        'bg-gradient-to-br from-sky-500 to-primary-strong',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}

      {status ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface',
            statusColor,
          )}
        />
      ) : null}
    </span>
  )
}
