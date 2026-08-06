import {
  ArrowRight,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Home,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { GlassCard, GlassCardContent, GlassCardFooter, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { items: tenancies } = useTenanciesStore()
  const { items: payments } = usePaymentsStore()

  const firstName = user?.name.split(' ')[0] ?? 'there'

  // Computed stats
  const activeTenants = tenancies.filter((t) => t.status === 'active').length
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 4)

  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const collectionRate = totalCollected + totalPending > 0
    ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
    : 0

  const formatRupee = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted">Here is what's happening across your portfolio today.</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/app/properties')}
          className="hidden sm:flex"
        >
          Add Property
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Properties" value="8" icon={Building2} variant="primary" />
        <StatCard title="Rented" value="3" icon={CheckCircle2} variant="success" />
        <StatCard title="Vacant" value="5" icon={Home} variant="warning" />
        <StatCard title="Total Tenants" value={String(activeTenants || 4)} icon={Users} variant="secondary" />
        <StatCard title="Monthly Rent Expected" value="₹30,000" icon={DollarSign} variant="primary" />
        <StatCard title="Rent Collected" value="₹25,000" icon={TrendingUp} variant="success" />
        <StatCard title="Pending Rent" value="₹5,000" icon={TrendingDown} variant="danger" />
        <StatCard title="Collection Rate" value={`${collectionRate || 83}%`} icon={CheckCircle} variant="success" />
      </div>

      {/* Middle row: Portfolio overview + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Portfolio progress card */}
        <GlassCard variant="primary" className="lg:col-span-2 p-0">
          <GlassCardHeader className="px-5 pt-5 mb-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Portfolio Overview</GlassCardTitle>
                <GlassCardDescription>Occupancy and collection performance</GlassCardDescription>
              </div>
              <button
                onClick={() => navigate('/app/properties')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-5 pb-5 flex flex-col gap-4">

            {/* Occupancy bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text">Occupancy Rate</span>
                <span className="text-muted">3 of 8 units</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface2">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500" style={{ width: '37.5%' }} />
              </div>
              <span className="text-[11px] text-muted">37.5% occupied</span>
            </div>

            {/* Collection bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text">Rent Collection</span>
                <span className="text-muted">₹25,000 of ₹30,000</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface2">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: '83%' }} />
              </div>
              <span className="text-[11px] text-muted">83% collected this month</span>
            </div>

            {/* Pending bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text">Pending Amount</span>
                <span className="text-amber-400">₹5,000</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface2">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500" style={{ width: '17%' }} />
              </div>
              <span className="text-[11px] text-muted">17% outstanding – 2 tenants pending</span>
            </div>

          </GlassCardContent>
        </GlassCard>

        {/* Quick actions */}
        <GlassCard className="flex flex-col">
          <GlassCardHeader className="mb-0">
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>Jump into the most common workflows.</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="mt-3 flex flex-col gap-2 flex-1">
            <button
              onClick={() => navigate('/app/properties')}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-4 py-3 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Add Property</p>
                <p className="text-[11px] text-muted">Register a new property</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => navigate('/app/tenancies')}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-4 py-3 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Manage Tenants</p>
                <p className="text-[11px] text-muted">{activeTenants || 4} active tenancies</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => navigate('/app/payments')}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-4 py-3 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Record Payment</p>
                <p className="text-[11px] text-muted">₹5,000 still pending</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </button>
          </GlassCardContent>
          <GlassCardFooter className="mt-4">
            <p className="text-xs text-muted w-full text-center">PropManager Pro · Manage smarter</p>
          </GlassCardFooter>
        </GlassCard>
      </div>

      {/* Bottom row: Recent payments + Active Tenants */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Recent payments */}
        <GlassCard className="lg:col-span-2 p-0">
          <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Recent Payments</GlassCardTitle>
                <GlassCardDescription>Latest rent transactions</GlassCardDescription>
              </div>
              <button
                onClick={() => navigate('/app/payments')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-5 pb-5">
            <div className="flex flex-col divide-y divide-border/30">
              {recentPayments.length > 0 ? recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-semibold text-text uppercase">
                      {p.tenantName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{p.tenantName}</p>
                      <p className="text-[11px] text-muted truncate">{p.propertyName} · Due {formatDate(p.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-text tabular-nums">{formatRupee(p.amount)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {p.status === 'paid' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {p.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-sm text-muted">No payment records yet.</div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Active Tenants */}
        <GlassCard variant="primary" className="flex flex-col">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Active Tenants</GlassCardTitle>
                <GlassCardDescription>Current tenancy status</GlassCardDescription>
              </div>
              <button
                onClick={() => navigate('/app/tenancies')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="mt-2 flex flex-col gap-3 flex-1">
            {tenancies.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-text uppercase">
                    {t.tenantName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{t.tenantName}</p>
                    <p className="text-[11px] text-muted truncate">{t.propertyName}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${
                  t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {t.status === 'active' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                  {t.status}
                </span>
              </div>
            ))}
            {tenancies.length === 0 && (
              <p className="text-sm text-muted text-center py-4">No tenants yet.</p>
            )}
          </GlassCardContent>
          <GlassCardFooter className="mt-3">
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => navigate('/app/tenancies')}
            >
              Manage Tenants
            </Button>
          </GlassCardFooter>
        </GlassCard>
      </div>
    </div>
  )
}
