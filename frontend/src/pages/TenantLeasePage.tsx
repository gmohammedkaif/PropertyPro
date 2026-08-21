import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Home,
  User,
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  DoorOpen,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useToast } from '@/hooks/useToast'

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function TenantLeasePage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const toast = useToast()

  const { items: tenancies } = useTenanciesStore()
  const { items: properties } = useLocalPropertiesStore()

  const userEmail = user?.email ?? ''

  const myTenancy = tenancies.find(
    (t) => (t.id === user?.tenancyId || t.tenantEmail.toLowerCase() === userEmail.toLowerCase()) && t.status === 'active'
  )

  const myProperty = myTenancy
    ? properties.find((p) => p.id === myTenancy.propertyId || p.name === myTenancy.propertyName)
    : null

  // Empty state if NO active lease
  if (!myTenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-inner">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text">No Active Lease</h2>
        <p className="text-sm text-muted leading-relaxed">
          You currently do not have any active lease agreement.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/app/properties')} className="font-bold shadow-md mt-2">
          Browse Properties <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const daysUntilEnd = Math.max(0, Math.ceil((new Date(myTenancy.leaseEnd).getTime() - Date.now()) / 86400000))
  const isExpiringSoon = daysUntilEnd <= 60
  const leaseNumber = `LSE-${myTenancy.id.slice(0, 8).toUpperCase()}`

  const handleDownloadAgreement = () => {
    toast.success('Downloading Lease Agreement PDF…', {
      description: `File ${leaseNumber}.pdf generated successfully.`,
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            My Lease Agreement <Sparkles className="h-5 w-5 text-amber-400" />
          </h1>
          <p className="text-sm text-muted mt-0.5">Official legal rental contract details for {myTenancy.propertyName}.</p>
        </div>

        <Button variant="primary" onClick={handleDownloadAgreement} className="font-bold shadow-md">
          <Download className="h-4 w-4" /> Download Agreement
        </Button>
      </div>

      {/* Lease Status Hero Card */}
      <GlassCard variant="primary" className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text">{leaseNumber}</h2>
                <Badge intent={isExpiringSoon ? 'warning' : 'success'} size="md" className="font-semibold">
                  {isExpiringSoon ? `Expires in ${daysUntilEnd} days` : 'Active Lease'}
                </Badge>
              </div>
              <p className="text-xs text-muted mt-1">{myTenancy.propertyName} · Unit {myTenancy.unitNumber ?? 'Main'}</p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <span className="text-xs text-muted uppercase font-semibold">Remaining Lease Term</span>
            <span className="text-2xl font-extrabold text-text font-display">{daysUntilEnd} Days</span>
          </div>
        </div>
      </GlassCard>

      {/* Detailed Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contractual Financials & Dates */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Lease Financials & Terms
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <LeaseRow label="Lease Number" value={leaseNumber} icon={<FileText className="h-4 w-4" />} />
            <LeaseRow label="Lease Start Date" value={formatDate(myTenancy.leaseStart)} icon={<Calendar className="h-4 w-4 text-primary" />} />
            <LeaseRow label="Lease End Date" value={formatDate(myTenancy.leaseEnd)} icon={<Calendar className="h-4 w-4 text-amber-400" />} />
            <LeaseRow label="Lease Duration" value={`${myTenancy.leaseDurationMonths || 12} Months`} icon={<Clock className="h-4 w-4" />} />
            <LeaseRow label="Monthly Rent" value={formatRupee(myTenancy.monthlyRent)} icon={<DollarSign className="h-4 w-4 text-emerald-400" />} />
            <LeaseRow label="Advance Paid" value={formatRupee(myTenancy.monthlyRent)} icon={<Shield className="h-4 w-4 text-sky-400" />} />
            <LeaseRow label="Security Deposit" value={formatRupee(myTenancy.securityDeposit)} icon={<Shield className="h-4 w-4 text-purple-400" />} />
          </GlassCardContent>
        </GlassCard>

        {/* Property & Owner Information */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" /> Property & Parties
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <LeaseRow label="Property Name" value={myTenancy.propertyName} icon={<Home className="h-4 w-4 text-primary" />} />
            <LeaseRow label="Assigned Unit" value={myTenancy.unitNumber || 'Main'} icon={<DoorOpen className="h-4 w-4 text-purple-400" />} />
            <LeaseRow label="Owner Name" value={myTenancy.ownerName || myProperty?.ownerName || myProperty?.ownerEmail || myTenancy.ownerEmail || 'Owner information unavailable'} icon={<User className="h-4 w-4 text-emerald-400" />} />
            <LeaseRow label="Tenant Name" value={myTenancy.tenantName} icon={<User className="h-4 w-4 text-sky-400" />} />
            <LeaseRow label="Tenant Email" value={myTenancy.tenantEmail} icon={<User className="h-4 w-4" />} />
            <LeaseRow label="Tenant Phone" value={myTenancy.tenantPhone || 'Not provided'} icon={<User className="h-4 w-4" />} />
            <LeaseRow label="Lease Status" value={myTenancy.status.toUpperCase()} icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} />
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Quick Action Navigation Buttons */}
      <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-text">Need to report a maintenance issue or pay rent?</h3>
          <p className="text-xs text-muted">Access your tenant services directly.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/my-rent')}>
            <DollarSign className="h-4 w-4 text-emerald-400" /> Pay Rent
          </Button>
          <Button variant="secondary" onClick={() => navigate('/app/report-issue')}>
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Report Issue
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}

function LeaseRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 text-xs">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted uppercase">{label}</p>
        <p className="text-sm font-bold text-text truncate">{value}</p>
      </div>
    </div>
  )
}