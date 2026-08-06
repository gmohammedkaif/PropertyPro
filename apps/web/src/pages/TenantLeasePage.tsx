import { Calendar, Clock, DollarSign, FileText, Home, MapPin, User, Shield, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function TenantLeasePage() {
  const user = useAuthStore((state) => state.user)
  const { items: tenancies } = useTenanciesStore()
  const { items: properties } = useLocalPropertiesStore()
  const navigate = useNavigate()

  const myTenancy = tenancies.find(
    (t) => t.id === user?.tenancyId || t.tenantEmail === user?.email
  )

  const myProperty = myTenancy
    ? properties.find((p) => p.id === myTenancy.propertyId)
    : null

  if (!myTenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <FileText className="h-12 w-12 text-muted" />
        <h2 className="text-lg font-semibold text-text">No Active Lease</h2>
        <p className="text-sm text-muted">You don't have any active tenancy linked to your account.</p>
        <Button variant="primary" onClick={() => navigate('/app/properties')}>
          Browse Properties
        </Button>
      </div>
    )
  }

  const daysUntilEnd = Math.ceil((new Date(myTenancy.leaseEnd).getTime() - Date.now()) / 86400000)
  const isExpiringSoon = daysUntilEnd <= 60

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">My Lease</h1>
        <p className="text-sm text-muted mt-0.5">View your lease agreement details for {myTenancy.propertyName}.</p>
      </div>

      {/* Lease Status Card */}
      <GlassCard variant="primary">
        <GlassCardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GlassCardTitle className="text-xl">Lease Agreement</GlassCardTitle>
                <Badge intent={isExpiringSoon ? 'warning' : 'success'} size="sm">
                  {isExpiringSoon ? `Expires in ${daysUntilEnd} days` : 'Active'}
                </Badge>
              </div>
              <GlassCardDescription className="mt-1">{myTenancy.propertyName}{myTenancy.unitNumber ? ` · Unit ${myTenancy.unitNumber}` : ''}</GlassCardDescription>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lease Terms */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Lease Terms</GlassCardTitle>
            <GlassCardDescription>Key dates and financial details</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <LeaseDetailRow label="Lease Start" value={formatDate(myTenancy.leaseStart)} icon={<Calendar className="h-4 w-4" />} />
            <LeaseDetailRow label="Lease End" value={formatDate(myTenancy.leaseEnd)} icon={<Calendar className="h-4 w-4" />} />
            <LeaseDetailRow label="Monthly Rent" value={formatRupee(myTenancy.monthlyRent)} icon={<DollarSign className="h-4 w-4" />} />
            <LeaseDetailRow label="Security Deposit" value={formatRupee(myTenancy.securityDeposit)} icon={<Shield className="h-4 w-4" />} />
            <LeaseDetailRow label="Total Lease Value" value={formatRupee(myTenancy.monthlyRent * 12)} icon={<DollarSign className="h-4 w-4" />} />
          </GlassCardContent>
        </GlassCard>

        {/* Property Details */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Property Details</GlassCardTitle>
            <GlassCardDescription>Information about your rented property</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <LeaseDetailRow label="Property Name" value={myProperty?.name ?? 'N/A'} icon={<Home className="h-4 w-4" />} />
            <LeaseDetailRow label="Address" value={`${myProperty?.address.line1 ?? ''}, ${myProperty?.address.city ?? ''}, ${myProperty?.address.state ?? ''}`} icon={<MapPin className="h-4 w-4" />} />
            <LeaseDetailRow label="Property Type" value={myProperty?.type ?? 'N/A'} icon={<Home className="h-4 w-4" />} />
            <LeaseDetailRow label="Unit Number" value={myTenancy.unitNumber ?? 'N/A'} icon={<Key className="h-4 w-4" />} />
            <LeaseDetailRow label="Landlord" value={myProperty ? 'Property Owner' : 'N/A'} icon={<User className="h-4 w-4" />} />
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Tenancy Information */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Tenancy Information</GlassCardTitle>
          <GlassCardDescription>Your tenancy record details</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <LeaseDetailRow label="Tenancy ID" value={myTenancy.id} icon={<FileText className="h-4 w-4" />} />
          <LeaseDetailRow label="Tenant Name" value={myTenancy.tenantName} icon={<User className="h-4 w-4" />} />
          <LeaseDetailRow label="Tenant Email" value={myTenancy.tenantEmail} icon={<User className="h-4 w-4" />} />
          <LeaseDetailRow label="Tenant Phone" value={myTenancy.tenantPhone} icon={<User className="h-4 w-4" />} />
          <LeaseDetailRow label="Units Occupied" value={String(myTenancy.unitsOccupied)} icon={<Key className="h-4 w-4" />} />
          <LeaseDetailRow label="Status" value={myTenancy.status.charAt(0).toUpperCase() + myTenancy.status.slice(1).replace('-', ' ')} icon={<Shield className="h-4 w-4" />} />
          <LeaseDetailRow label="Created On" value={formatDate(myTenancy.createdAt)} icon={<Calendar className="h-4 w-4" />} />
          <LeaseDetailRow label="Last Updated" value={formatDate(myTenancy.updatedAt)} icon={<Clock className="h-4 w-4" />} />
        </GlassCardContent>
      </GlassCard>

      {/* Actions */}
      <GlassCard>
        <GlassCardContent className="p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate('/app/my-rent')}>
              <DollarSign className="h-4 w-4" />
              Pay Rent
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/report-issue')}>
              <Shield className="h-4 w-4" />
              Report Issue
            </Button>
            <Button variant="primary" onClick={() => navigate('/app/properties')}>
              <Home className="h-4 w-4" />
              Browse Properties
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}

function LeaseDetailRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-sm font-medium text-text truncate">{value}</p>
      </div>
    </div>
  )
}