import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Home,
  Plus,
  Users,
  Wrench,
  ShoppingBag,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { GlassCard, GlassCardContent, GlassCardFooter, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useRentalRequestsStore } from '@/stores/rentalRequestsStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useAdminStats } from '@/hooks/useAdmin'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const fmtRupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const { items: allTenancies } = useTenanciesStore()
  const { items: allPayments } = usePaymentsStore()
  const { items: allProperties } = useLocalPropertiesStore()
  const { items: allRentalRequests } = useRentalRequestsStore()
  const { items: allMaintenanceItems } = useMaintenanceStore()
  const { items: allNotifications } = useNotificationsStore()

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'

  const { data: adminStats } = useAdminStats({ enabled: isSuperAdmin })

  // ── Role Data Isolation ───────────────────────────────────────────────────────
  const properties = isSuperAdmin
    ? allProperties
    : allProperties.filter((p) => p.ownerEmail?.toLowerCase() === userEmail || p.ownerId === userId)

  const ownerPropertyIds = new Set(properties.map((p) => p.id))
  const ownerPropertyNames = new Set(properties.map((p) => p.name.toLowerCase()))

  const tenancies = isSuperAdmin
    ? allTenancies
    : allTenancies.filter(
        (t) =>
          t.ownerEmail?.toLowerCase() === userEmail ||
          ownerPropertyIds.has(t.propertyId) ||
          ownerPropertyNames.has(t.propertyName.toLowerCase()),
      )

  const rentalRequests = isSuperAdmin
    ? allRentalRequests
    : allRentalRequests.filter(
        (r) =>
          r.ownerEmail?.toLowerCase() === userEmail ||
          r.ownerId === userId ||
          ownerPropertyIds.has(r.propertyId) ||
          ownerPropertyNames.has(r.propertyName.toLowerCase()),
      )

  const maintenanceItems = isSuperAdmin
    ? allMaintenanceItems
    : allMaintenanceItems.filter(
        (m) =>
          (m.propertyId && ownerPropertyIds.has(m.propertyId)) ||
          ownerPropertyNames.has(m.propertyName.toLowerCase()),
      )

  const ownerTenantNames = new Set(tenancies.map((t) => t.tenantName.toLowerCase()))
  const payments = isSuperAdmin
    ? allPayments
    : allPayments.filter(
        (p) =>
          ownerPropertyNames.has(p.propertyName.toLowerCase()) ||
          ownerTenantNames.has(p.tenantName.toLowerCase()),
      )

  const notifications = isSuperAdmin
    ? allNotifications
    : allNotifications.filter((n) => n.userEmail.toLowerCase() === userEmail)

  // ── Real Computed Stats ───────────────────────────────────────────────────────
  const totalProperties = properties.length
  const forRentCount = properties.filter((p) => p.listingStatus === 'for-rent').length
  const forSaleCount = properties.filter((p) => p.listingStatus === 'for-sale').length
  const occupiedCount = properties.filter((p) => p.listingStatus === 'occupied').length

  const activeTenants = tenancies.filter((t) => t.status === 'active').length
  const pendingRequests = rentalRequests.filter((r) => r.status === 'pending').length
  const openMaintenance = maintenanceItems.filter((m) => m.status === 'open' || m.status === 'assigned' || m.status === 'in-progress').length

  const monthlyIncome = tenancies
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.monthlyRent, 0)

  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const collectionRate = totalCollected + totalPending > 0
    ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
    : 0

  const totalUnits = properties.reduce((s, p) => s + p.totalUnits, 0)
  const occupiedUnits = properties.reduce((s, p) => s + p.occupiedUnits, 0)
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  // ── Recent Activity Feed ──────────────────────────────────────────────────────
  type Activity = { id: string; text: string; subtext: string; time: string; icon: typeof Building2; color: string }
  const recentActivity: Activity[] = [
    ...rentalRequests.slice(0, 3).map((r) => ({
      id: `req_${r.id}`,
      text: r.status === 'pending'
        ? `${r.fullName} requested ${r.propertyName}`
        : r.status === 'approved'
        ? `Approved: ${r.fullName} for ${r.propertyName}`
        : `Rejected: ${r.fullName} for ${r.propertyName}`,
      subtext: r.city,
      time: r.createdAt,
      icon: UserCheck,
      color: r.status === 'pending' ? 'text-amber-400 bg-amber-500/10' : r.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
    })),
    ...maintenanceItems.filter(m => m.status === 'open').slice(0, 2).map((m) => ({
      id: `mnt_${m.id}`,
      text: `Maintenance: ${m.title}`,
      subtext: m.propertyName,
      time: m.createdAt,
      icon: Wrench,
      color: 'text-orange-400 bg-orange-500/10',
    })),
    ...tenancies.slice(0, 2).map((t) => ({
      id: `tnc_${t.id}`,
      text: `Lease active: ${t.tenantName}`,
      subtext: t.propertyName,
      time: t.createdAt,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6)

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  // Owner notifications
  const myNotifications = notifications
    .filter((n) => n.userEmail.toLowerCase() === userEmail.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted">
            Here is what's happening across your portfolio today ·{' '}
            <span className="text-text font-medium">{fmtDate(new Date().toISOString())}</span>
          </p>
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

      {/* ── Stats Grid ─────────────────────────────────────────────────────────── */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Total Properties" value={String(adminStats?.totalProperties ?? 0)} icon={Building2} variant="primary" />
          <StatCard title="Rented Properties" value={String(adminStats?.rentedProperties ?? 0)} icon={UserCheck} variant="success" />
          <StatCard title="Available Properties" value={String(adminStats?.availableProperties ?? 0)} icon={Home} variant="secondary" />
          <StatCard title="Properties for Sale" value={String(adminStats?.propertiesForSale ?? 0)} icon={ShoppingBag} variant="warning" />
          <StatCard title="Total Owners" value={String(adminStats?.totalOwners ?? 0)} icon={Users} variant="primary" />
          <StatCard title="Total Tenants" value={String(adminStats?.totalTenants ?? 0)} icon={Users} variant="secondary" />
          <StatCard title="Active Leases" value={String(adminStats?.activeTenants ?? 0)} icon={UserCheck} variant="success" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Properties" value={String(totalProperties)} icon={Building2} variant="primary" />
          <StatCard title="For Rent" value={String(forRentCount)} icon={Home} variant="secondary" />
          <StatCard title="For Sale" value={String(forSaleCount)} icon={ShoppingBag} variant="warning" />
          <StatCard title="Occupied" value={String(occupiedCount)} icon={UserCheck} variant="success" />
          <StatCard title="Pending Requests" value={String(pendingRequests)} icon={ClipboardList} variant={pendingRequests > 0 ? 'danger' : 'default'} />
          <StatCard title="Active Tenants" value={String(activeTenants)} icon={Users} variant="secondary" />
          <StatCard title="Open Maintenance" value={String(openMaintenance)} icon={Wrench} variant={openMaintenance > 0 ? 'warning' : 'default'} />
          <StatCard title="Monthly Income" value={fmtRupee(monthlyIncome)} icon={DollarSign} variant="success" />
        </div>
      )}

      {/* ── Middle Row: Portfolio Overview + Quick Actions ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio Overview */}
        <GlassCard variant="primary" hover={true} className="lg:col-span-2 p-0">
          <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Portfolio Overview</GlassCardTitle>
                <GlassCardDescription>Occupancy and rent collection performance</GlassCardDescription>
              </div>
              <button
                onClick={() => navigate('/app/properties')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="px-5 pb-5 flex flex-col gap-5">
            {/* Occupancy bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text">Occupancy Rate</span>
                <span className="text-muted">{occupiedUnits} of {totalUnits} units</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface2">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-700"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <span className="text-[11px] text-muted">{occupancyRate}% occupied · {totalUnits - occupiedUnits} units available</span>
            </div>

            {/* Collection bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-text">Rent Collection</span>
                <span className="text-muted">{fmtRupee(totalCollected)} of {fmtRupee(totalCollected + totalPending)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface2">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <span className="text-[11px] text-muted">{collectionRate}% collected this month</span>
            </div>

            {/* Pending bar */}
            {totalPending > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-text">Pending Amount</span>
                  <span className="text-amber-400 font-semibold">{fmtRupee(totalPending)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface2">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${Math.round((totalPending / (totalCollected + totalPending)) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted">
                  {Math.round((totalPending / (totalCollected + totalPending)) * 100)}% outstanding
                </span>
              </div>
            )}

            {/* Property Status Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/40">
              {[
                { label: 'For Rent', val: forRentCount, color: 'text-primary bg-primary/10 border-primary/20' },
                { label: 'For Sale', val: forSaleCount, color: 'text-warning bg-warning/10 border-warning/20' },
                { label: 'Occupied', val: occupiedCount, color: 'text-success bg-success/10 border-success/20' },
                { label: 'Inactive', val: properties.filter(p => p.listingStatus === 'inactive').length, color: 'text-muted bg-surface-2 border-border' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`rounded-xl border px-3 py-2.5 text-center transition-colors duration-200 ${color}`}>
                  <p className="text-xl font-bold font-display">{val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard hover={true} className="flex flex-col">
          <GlassCardHeader className="mb-0">
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>Jump into the most common workflows.</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="mt-3 flex flex-col gap-2 flex-1">
            {[
              { label: 'Add Property', sub: 'Register a new property', icon: Building2, color: 'bg-primary/10 text-primary group-hover:bg-primary/20', path: '/app/properties' },
              { label: 'Tenant Requests', sub: `${pendingRequests} pending review`, icon: ClipboardList, color: 'bg-warning/10 text-warning group-hover:bg-warning/20', path: '/app/tenant-requests' },
              { label: 'Manage Tenants', sub: `${activeTenants} active tenancies`, icon: Users, color: 'bg-info/10 text-info group-hover:bg-info/20', path: '/app/tenancies' },
              { label: 'Maintenance', sub: `${openMaintenance} open requests`, icon: Wrench, color: 'bg-warning/15 text-warning group-hover:bg-warning/25', path: '/app/maintenance' },
              { label: 'Payments', sub: `${fmtRupee(totalPending)} pending`, icon: DollarSign, color: 'bg-success/10 text-success group-hover:bg-success/20', path: '/app/payments' },
            ].map(({ label, sub, icon: Icon, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface2/40 px-4 py-2.5 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-primary/8 hover:text-primary group"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[11px] text-muted">{sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </button>
            ))}
          </GlassCardContent>
          <GlassCardFooter className="mt-4">
            <p className="text-xs text-muted w-full text-center">PropertyPro · Manage smarter</p>
          </GlassCardFooter>
        </GlassCard>
      </div>

      {/* ── Bottom Row: Recent Payments + Activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Payments */}
        <GlassCard hover={true} className="lg:col-span-2 p-0">
          <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle>Recent Payments</GlassCardTitle>
                <GlassCardDescription>Latest rent transactions across your portfolio</GlassCardDescription>
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
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-text uppercase">
                      {p.tenantName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{p.tenantName}</p>
                      <p className="text-[11px] text-muted truncate">{p.propertyName} · Due {fmtDate(p.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-text tabular-nums">{fmtRupee(p.amount)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {p.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
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

        {/* Right Column: Recent Activity + Notifications */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity */}
          <GlassCard variant="primary" hover={true} className="p-0 flex-1">
            <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Recent Activity
                </GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="px-5 pb-5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No recent activity.</p>
              ) : (
                <div className="relative flex flex-col gap-0">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border/40" />
                  {recentActivity.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-2.5 relative">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full z-10 ${event.color}`}>
                        <event.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-xs font-medium text-text leading-tight">{event.text}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-muted">{event.subtext}</span>
                          <span className="text-muted">·</span>
                          <span className="text-[10px] text-muted">{fmtRelative(event.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Notifications */}
          {myNotifications.length > 0 && (
            <GlassCard hover={true} className="p-0">
              <GlassCardHeader className="px-4 pt-4 pb-2 mb-0">
                <GlassCardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-primary" /> Notifications
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="px-4 pb-4">
                <div className="flex flex-col gap-2">
                  {myNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg px-3 py-2 text-xs border ${
                        n.type === 'success' ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400' :
                        n.type === 'danger' ? 'bg-red-500/8 border-red-500/20 text-red-400' :
                        n.type === 'warning' ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' :
                        'bg-sky-500/8 border-sky-500/20 text-sky-400'
                      }`}
                    >
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-muted mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Pending Alerts */}
          {pendingRequests > 0 && (
            <GlassCard variant="warning" className="p-4 cursor-pointer hover:-translate-y-0.5 transition-transform" onClick={() => navigate('/app/tenant-requests')}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-text">
                    {pendingRequests} request{pendingRequests > 1 ? 's' : ''} awaiting review
                  </p>
                  <p className="text-xs text-muted mt-0.5">Tap to review tenant rental requests</p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
