import { Building2, Calendar, User, DoorOpen, CheckCircle, ShieldCheck } from 'lucide-react'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { derivePropertyUnits } from '@/lib/unitUtils'

interface PropertyUnitsCardProps {
  property: {
    id: string
    name: string
    type: string
    totalUnits?: number
    occupiedUnits?: number
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

export function PropertyUnitsCard({
  property,
  tenancies,
  title = 'Individual Unit Management',
  className = '',
}: PropertyUnitsCardProps) {
  const units = derivePropertyUnits(
    { id: property.id, type: property.type, totalUnits: property.totalUnits ?? 1 },
    tenancies
  )
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
        <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isOccupied ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text">{unit.unitNumber}</h4>
                      <p className="text-[10px] text-muted">{unit.floor}</p>
                    </div>
                  </div>

                  <Badge intent={isOccupied ? 'warning' : 'success'} size="sm" className="font-semibold uppercase tracking-wider">
                    {unit.status}
                  </Badge>
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
                    <div className="flex items-center gap-2 text-xs text-muted py-2">
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
