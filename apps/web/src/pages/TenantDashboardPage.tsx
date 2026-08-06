import { Calendar, Clock, DollarSign, Home, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TenantDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { items: tenancies } = useTenanciesStore()
  const { items: payments } = usePaymentsStore()
  const { items: properties } = useLocalPropertiesStore()
  const navigate = useNavigate()

  const firstName = user?.name.split(' ')[0] ?? 'there'

  // Find their tenancy by tenancyId stored in auth, or match by email
  const myTenancy = tenancies.find(
    (t) => t.id === user?.tenancyId || t.tenantEmail === user?.email
  )

  const myProperty = myTenancy
    ? properties.find((p) => p.id === myTenancy.propertyId)
    : null

  const myPayments = payments.filter(
    (p) => p.tenantName === myTenancy?.tenantName
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  const pendingPayment = myPayments.find((p) => p.status === 'pending' || p.status === 'overdue')

  // Days until lease ends
  const daysUntilEnd = myTenancy
    ? Math.ceil((new Date(myTenancy.leaseEnd).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted mt-0.5">Welcome to your tenant portal.</p>
        </div>
        {pendingPayment && (
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300 font-medium">Rent due soon</span>
          </div>
        )}
      </div>

      {/* My Home card */}
      {myTenancy && myProperty ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GlassCard variant="primary" className="lg:col-span-2 p-0">
            <GlassCardHeader className="px-5 pt-5 pb-4 mb-0">
              <div className="flex items-center justify-between">
                <div>
                  <GlassCardTitle>My Home</GlassCardTitle>
                  <GlassCardDescription>Your current tenancy details</GlassCardDescription>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="h-3.5 w-3.5" /> Active
                </span>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="px-5 pb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted">
                  <Home className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Property</span>
                </div>
                <p className="text-sm font-semibold text-text">{myProperty.name}</p>
                <p className="text-xs text-muted">{myProperty.address.city}</p>
              </div>
              {myTenancy.unitNumber && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Unit</span>
                  <p className="text-sm font-semibold text-text">{myTenancy.unitNumber}</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Monthly Rent</span>
                </div>
                <p className="text-sm font-semibold text-text">{formatRupee(myTenancy.monthlyRent)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Lease Ends</span>
                </div>
                <p className="text-sm font-semibold text-text">{formatDate(myTenancy.leaseEnd)}</p>
                {daysUntilEnd !== null && daysUntilEnd <= 60 && (
                  <span className="text-[10px] text-amber-400">{daysUntilEnd} days left</span>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Quick actions */}
          <GlassCard className="flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold text-text">Quick Actions</h3>
            <Button
              variant="primary"
              className="w-full justify-between"
              onClick={() => navigate('/app/my-rent')}
            >
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Pay Rent
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => navigate('/app/report-issue')}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Report Issue
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => navigate('/app/my-lease')}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> My Lease
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </GlassCard>
        </div>
      ) : (
        <GlassCard className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">No Active Tenancy</h3>
            <p className="text-sm text-muted mt-1">You don't have an active tenancy yet. Browse available properties to get started.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/app/properties')}>
            Browse Properties
          </Button>
        </GlassCard>
      )}

      {/* Recent payments */}
      {myPayments.length > 0 && (
        <GlassCard className="p-0">
          <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Recent Payments</GlassCardTitle>
                <GlassCardDescription>Your rent payment history</GlassCardDescription>
              </div>
              <button
                onClick={() => navigate('/app/my-rent')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-5 pb-5">
            <div className="flex flex-col divide-y divide-border/30">
              {myPayments.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <p className="text-sm font-medium text-text">
                      {p.type === 'rent' ? 'Monthly Rent' : p.type}
                    </p>
                    <p className="text-[11px] text-muted">Due {formatDate(p.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text tabular-nums">{formatRupee(p.amount)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
