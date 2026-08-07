import type { ChangeEvent } from 'react'

import { cn } from '@/lib/utils'

const ROLES = [
  { value: 'tenant', label: 'Tenant', description: 'Rent a property, pay rent, report issues' },
  { value: 'owner', label: 'House Owner', description: 'List and manage properties' },
] as const

interface RoleSelectorProps {
  value?: string
  onChange: (value: string) => void
  error?: string
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-text">Account type</label>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => (
          <label
            key={role.value}
            className={cn(
              'glass cursor-pointer rounded-xl p-4 text-center transition-all duration-150 hover:bg-surface2',
              value === role.value && 'ring-2 ring-primary ring-offset-2 ring-offset-bg',
            )}
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={value === role.value}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-text">{role.label}</p>
            <p className="mt-1 text-xs text-muted">{role.description}</p>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  )
}