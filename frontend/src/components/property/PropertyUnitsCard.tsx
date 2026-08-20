import { Building2, Calendar, User, DoorOpen, CheckCircle, ShieldCheck } from 'lucide-react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { derivePropertyUnits } from '@/lib/unitUtils'
import type { PropertyUnit } from '@/shared'

interface PropertyUnitsCardProps {
  property: {
    id: string
    name: string
    type: string
    totalUnits?: number
    occupiedUnits?: number
    bedrooms?: number
    bathrooms?: number
    parking?: number
    areaSqFt?: number
    monthlyRent?: number
    securityDeposit?: number
    units?: PropertyUnit[]
  }
  tenancies: Array<{
    id: string
    propertyId: string
    propertyName?: string
    unitNumber?: string
    status: string
    tenantName: string
    tenantEmail: string
    tenantPhone?: string
    leaseStart: string
    leaseEnd: string
  }>
  title?: string
  className?: string
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatRupee(amount?: number) {
  if (!amount || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PropertyUnitsCard({
  property,
  tenancies,
  title = 'Individual Unit Management',
  className = '',
}: PropertyUnitsCardProps) {
  const units = derivePropertyUnits(property, tenancies)
  const occupiedCount = units.filter((u) => u.status === 'OCCUPIED').length
  const availableCount = units.filter((u) => u.status === 'AVAILABLE').length

  return (
    <GlassCard className={className}>
      <GlassCardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <GlassCardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {title}
          </GlassCardTitle>
          <p className="text-xs text-muted mt-0.5">
            Real-time unit allocation & tenant assignment for {property.name}.
          </p>
        </div>

        {/* Overview Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface2/40 px-2.5 py-1 text-xs font-semibold">
            <span className="text-muted">Total:</span>
            <span className="text-text font-bold">{units.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Available: {availableCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <User className="h-3.5 w-3.5" />
            <span>Occupied: {occupiedCount}</span>
          </div>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => {
            const isOccupied = unit.status === 'OCCUPIED'

            return (
              <div
                key={unit.unitNumber}
                className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isOccupied
                    ? 'border-amber-500/30 bg-amber-500/5 shadow-sm'
                    : 'border-border/60 bg-surface2/30 hover:border-primary/40 hover:bg-surface2/60'
                }`}
              >
                {/* Card Header: Unit Number & Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isOccupied ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text truncate">{unit.unitNumber}</h4>
                      <p className="text-[10px] text-muted truncate">{unit.floor}</p>
                    </div>
                  </div>

                  <Badge intent={isOccupied ? 'warning' : 'success'} size="sm" className="font-semibold uppercase tracking-wider">
                    {unit.status}
                  </Badge>
                </div>

                {/* Unit Specifications Grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] border-b border-border/30 pb-3">
                  <div>
                    <span className="text-muted block text-[10px]">Specs:</span>
                    <span className="font-semibold text-text">
                      {unit.bedrooms !== undefined ? `${unit.bedrooms} BHK` : 'N/A'}, {unit.bathrooms !== undefined ? `${unit.bathrooms} Bath` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Area / Parking:</span>
                    <span className="font-semibold text-text">
                      {unit.areaSqFt ? `${unit.areaSqFt} sq ft` : 'N/A'} · {unit.parking ?? 0} P
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Rent:</span>
                    <span className="font-bold text-emerald-400">
                      {formatRupee(unit.monthlyRent)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[10px]">Deposit:</span>
                    <span className="font-semibold text-text">
                      {formatRupee(unit.securityDeposit)}
                    </span>
                  </div>
                </div>

                {/* Card Body: Tenant Info or Available Placeholder */}
                <div className="pt-3">
                  {isOccupied ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-text font-semibold">
                        <User className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{unit.tenantName}</span>
                      </div>
                      <p className="text-[11px] text-muted truncate pl-5.5">{unit.tenantEmail}</p>
                      {unit.leaseEnd && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted pt-1">
                          <Calendar className="h-3 w-3 text-primary shrink-0" />
                          <span>Lease End: {formatDate(unit.leaseEnd)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted py-1">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Ready for new tenancy</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  )
}
