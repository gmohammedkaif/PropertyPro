import { useState } from 'react'
import {
  Clock,
  DollarSign,
  Home,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Building2,
  Key,
  Bell,
  Search,
  Tag,
  MapPin,
  FileText,
  Wrench,
  PhoneCall,
  Sparkles,
  Inbox,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useRentalRequestsStore } from '@/stores/rentalRequestsStore'
import { useNotificationsStore } from '@/stores/notificationsStore'

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

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TenantDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const { items: tenancies } = useTenanciesStore()
  const { items: payments } = usePaymentsStore()
  const { items: properties } = useLocalPropertiesStore()
  const { items: rentalRequests } = useRentalRequestsStore()
  const { items: notifications, markAsRead } = useNotificationsStore()

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const userEmail = user?.email ?? ''

  // Active tenancy matching user strictly
  const myTenancy = tenancies.find(
    (t) =>
      (t.tenantEmail.toLowerCase() === userEmail.toLowerCase() ||
        (user?.tenancyId && t.id === user.tenancyId)) &&
      t.status === 'active',
  )

  const myProperty = myTenancy
    ? properties.find((p) => p.id === myTenancy.propertyId || p.name === myTenancy.propertyName)
    : null

  const myPayments = myTenancy
    ? payments
        .filter(
          (p) =>
            p.tenantName.toLowerCase() === myTenancy.tenantName.toLowerCase() ||
            p.tenantName.toLowerCase() === (user?.name ?? '').toLowerCase(),
        )
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    : []

  const pendingPayment = myPayments.find((p) => p.status === 'pending' || p.status === 'overdue')

  // Days until lease ends
  const daysUntilEnd = myTenancy
    ? Math.ceil((new Date(myTenancy.leaseEnd).getTime() - Date.now()) / 86400000)
    : null

  // User's rental requests (strictly for this tenant)
  const myRequests = rentalRequests.filter(
    (r) =>
      r.tenantEmail.toLowerCase() === userEmail.toLowerCase() ||
      (r.tenantId && r.tenantId === user?.id),
  )

  // User notifications (strictly for this tenant's email)
  const myNotifications = notifications.filter(
    (n) => n.userEmail.toLowerCase() === userEmail.toLowerCase(),
  )

  // Real properties for rent — exclude the tenant's own currently rented property
  const myRentedPropertyId = myTenancy?.propertyId ?? null

  const realRentProperties = properties
    .filter((p) =>
      p.listingStatus === 'for-rent' &&
      p.id !== myRentedPropertyId &&
      (p.totalUnits <= 0 || p.totalUnits - p.occupiedUnits > 0)
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: 'rent' as const,
      propertyType: p.type,
      price: p.monthlyRent || 0,
      bedrooms: p.bedrooms || (p.type === 'house' ? 3 : p.type === 'apartment' ? 2 : 1),
      bathrooms: p.bathrooms || (p.type === 'house' ? 3 : 2),
      areaSqFt: p.areaSqFt || (p.type === 'house' ? 2200 : 1200),
      city: p.address.city,
      ownerName: 'House Owner',
      status: 'available',
      description: p.description ?? 'Beautiful modern residential property ready for occupancy.',
      imageUrl: p.imageUrl,
    }))

  // Real properties for sale — exclude the tenant's own currently rented property
  const realSaleProperties = properties
    .filter((p) => p.listingStatus === 'for-sale' && p.id !== myRentedPropertyId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: 'sale' as const,
      propertyType: p.type,
      price: p.salePrice || 0,
      bedrooms: p.bedrooms || 3,
      bathrooms: p.bathrooms || 2,
      areaSqFt: p.areaSqFt || 1500,
      city: p.address.city,
      ownerName: 'House Owner',
      status: 'available',
      description: p.description ?? 'Beautiful modern residential property ready for occupancy.',
      imageUrl: p.imageUrl,
    }))


  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
            {greeting()}, {firstName} <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-0.5">Welcome to your SaaS tenant portal.</p>
        </div>

        {myTenancy && pendingPayment && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 animate-bounce" />
            <div className="text-xs">
              <span className="font-semibold">Rent Due Soon: </span>
              {formatRupee(pendingPayment.amount)} due by {formatDate(pendingPayment.dueDate)}
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* CASE 2: TENANT HAS ACTIVE RENTAL                    */}
      {/* ---------------------------------------------------- */}
      {myTenancy ? (
        <div className="flex flex-col gap-6">
          {/* Current Rental Summary & Quick Buttons */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Current Rental Summary Card */}
            <GlassCard variant="primary" className="lg:col-span-2 p-0 overflow-hidden relative group">
              <div className="p-6 flex flex-col sm:flex-row gap-6">
                {/* Property Image Placeholder / Badge */}
                <div className="relative h-44 sm:h-auto sm:w-48 rounded-xl overflow-hidden bg-surface2 shrink-0 border border-border/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-surface3 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/40" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge intent="success" size="sm" className="gap-1 font-semibold shadow-md">
                      <CheckCircle className="h-3 w-3" /> Active Rental
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-text group-hover:text-primary transition-colors">
                        {myTenancy.propertyName}
                      </h2>
                      <span className="text-xs text-muted font-mono">{myTenancy.unitNumber ? `Unit ${myTenancy.unitNumber}` : 'Main Property'}</span>
                    </div>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {myProperty?.address.city ?? 'Hyderabad'}, {myProperty?.address.state ?? 'Telangana'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-4 py-3 border-y border-border/40 text-xs">
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Monthly Rent</span>
                      <span className="text-base font-bold text-text font-display">{formatRupee(myTenancy.monthlyRent)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold font-display">Rent Due Date</span>
                      <span className="text-sm font-semibold text-text">{pendingPayment ? formatDate(pendingPayment.dueDate) : '1st of month'}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Owner Name</span>
                      <span className="text-sm font-medium text-text">{myProperty ? 'House Owner' : 'Property Manager'}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Lease Expiry</span>
                      <span className="text-sm font-medium text-text">{formatDate(myTenancy.leaseEnd)}</span>
                      {daysUntilEnd !== null && daysUntilEnd <= 60 && (
                        <span className="block text-[10px] text-amber-400 font-semibold">{daysUntilEnd} days remaining</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">Rent Status:</span>
                    {pendingPayment ? (
                      <Badge intent="warning" size="sm" className="font-semibold uppercase">
                        Pending
                      </Badge>
                    ) : (
                      <Badge intent="success" size="sm" className="font-semibold uppercase">
                        Paid Up To Date
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Quick Buttons Card */}
            <GlassCard className="p-6 flex flex-col justify-between gap-4">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Quick Actions
              </h3>

              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  className="w-full justify-between py-2.5 text-sm"
                  onClick={() => navigate('/app/my-rent')}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-4 w-4" /> Pay Rent
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-between py-2.5 text-sm"
                  onClick={() => navigate('/app/my-lease')}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" /> View Lease
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-between py-2.5 text-sm"
                  onClick={() => navigate('/app/report-issue')}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Wrench className="h-4 w-4 text-amber-400" /> Report Maintenance Issue
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between py-2.5 text-sm hover:bg-surface2"
                  onClick={() => navigate('/app/settings')}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <PhoneCall className="h-4 w-4 text-sky-400" /> Contact Owner
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Notifications & Recent Activity Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Notifications */}
            <GlassCard className="p-0 overflow-hidden">
              <GlassCardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" /> Recent Notifications
                  </GlassCardTitle>
                  <span className="text-xs text-muted">{myNotifications.length} items</span>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="px-5 pb-5">
                {myNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <Inbox className="h-8 w-8 text-muted/40" />
                    <p className="text-xs text-muted">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/30">
                    {myNotifications.slice(0, 4).map((n) => (
                      <div key={n.id} className="py-3 flex items-start justify-between gap-3 group">
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-muted/40' : 'bg-primary animate-ping'}`} />
                          <div>
                            <p className="text-xs font-semibold text-text">{n.title}</p>
                            <p className="text-[11px] text-muted leading-relaxed mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-muted/70 mt-1 block">{formatDate(n.createdAt)}</span>
                          </div>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-[10px] text-primary hover:underline shrink-0"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>

            {/* Recent Rent Activity */}
            <GlassCard className="p-0 overflow-hidden">
              <GlassCardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-emerald-400" /> Recent Rent Activity
                  </GlassCardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/app/my-rent')} className="text-xs text-primary">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="px-5 pb-5">
                {myPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <DollarSign className="h-8 w-8 text-muted/40" />
                    <p className="text-xs text-muted">No rent activity recorded.</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/30">
                    {myPayments.slice(0, 4).map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-text capitalize">{p.type} Payment</p>
                          <p className="text-[10px] text-muted">Due {formatDate(p.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-text tabular-nums">{formatRupee(p.amount)}</span>
                          <Badge
                            intent={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}
                            size="sm"
                            className="capitalize text-[10px]"
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* CASE 1: TENANT HAS NO RENTED PROPERTY                */
        /* ---------------------------------------------------- */
        <div className="flex flex-col gap-6">
          {/* Professional Empty State Banner */}
          <GlassCard variant="primary" className="p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Building2 className="h-48 w-48 text-primary" />
            </div>
            <div className="max-w-xl mx-auto flex flex-col items-center gap-3 relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text">No active rental yet</h2>
              <p className="text-sm text-muted">
                Browse our curated marketplace of verified house owner properties for rent and sale. Send direct rental requests and track approval status in real-time.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Button variant="primary" size="md" onClick={() => navigate('/app/properties')}>
                  <Search className="h-4 w-4" /> Browse Available Properties
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Rental Requests & Notifications Overview */}
          {(myRequests.length > 0 || myNotifications.length > 0) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* My Rental Requests */}
              <GlassCard className="p-0 overflow-hidden">
                <GlassCardHeader className="px-5 pt-5 pb-3">
                  <GlassCardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Rental Requests Sent ({myRequests.length})
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="px-5 pb-5">
                  {myRequests.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">No requests sent yet.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-border/30">
                      {myRequests.map((req) => (
                        <div key={req.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-text">{req.propertyName}</p>
                            <p className="text-[10px] text-muted">Requested on {formatDate(req.createdAt)} · {req.city}</p>
                          </div>
                          <Badge
                            intent={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'danger'}
                            size="sm"
                            className="capitalize"
                          >
                            {req.status === 'approved' ? <CheckCircle className="h-3 w-3" /> : req.status === 'pending' ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {req.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>

              {/* Notifications */}
              <GlassCard className="p-0 overflow-hidden">
                <GlassCardHeader className="px-5 pt-5 pb-3">
                  <GlassCardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" /> Notifications & Updates
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="px-5 pb-5">
                  {myNotifications.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">No notifications yet.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-border/30">
                      {myNotifications.slice(0, 3).map((n) => (
                        <div key={n.id} className="py-3">
                          <p className="text-xs font-semibold text-text">{n.title}</p>
                          <p className="text-[11px] text-muted mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {/* Available Properties for Rent Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Latest Properties For Rent
            </h3>
            <p className="text-xs text-muted">Properties created by House Owners available for instant booking</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/properties')} className="text-xs text-primary">
              View All Properties <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realRentProperties.slice(0, 3).map((property) => (
            <PropertyDisplayCard
              key={property.id}
              name={property.name}
              type="rent"
              propertyType={property.propertyType}
              price={property.price}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              areaSqFt={property.areaSqFt}
              city={property.city}
              ownerName={property.ownerName}
              description={property.description}
              imageUrl={property.imageUrl}
              onClick={() => navigate(`/app/property/${property.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Properties For Sale Section */}
      {realSaleProperties.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-400" /> Latest Properties For Sale
              </h3>
              <p className="text-xs text-muted">Buy real estate properties directly from house owners</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {realSaleProperties.map((property) => (
              <PropertyDisplayCard
                key={property.id}
                name={property.name}
                type="sale"
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                areaSqFt={property.areaSqFt}
                city={property.city}
                ownerName={property.ownerName}
                description={property.description}
                imageUrl={property.imageUrl}
                onClick={() => navigate(`/app/property/${property.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Property Display Card for SaaS Dashboard ────────────────────────────────
function PropertyDisplayCard({
  name,
  type,
  propertyType,
  price,
  bedrooms,
  bathrooms,
  areaSqFt,
  city,
  ownerName,
  description,
  imageUrl,
  onClick,
}: {
  name: string
  type: 'rent' | 'sale'
  propertyType?: string
  price: number
  bedrooms?: number
  bathrooms?: number
  areaSqFt?: number
  city?: string
  ownerName?: string
  description?: string
  imageUrl?: string
  onClick: () => void
}) {
  const [favorite, setFavorite] = useState(false)

  return (
    <div
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 cursor-pointer relative"
    >
      {/* Header Image visuals */}
      <div className="relative h-44 w-full overflow-hidden bg-surface2">
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-90 z-10" />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface3 group-hover:scale-105 transition-transform duration-500">
            <Building2 className="h-16 w-16 text-muted/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <Badge intent={type === 'rent' ? 'primary' : 'success'} size="sm" className="font-semibold shadow">
            {type === 'rent' ? 'For Rent' : 'For Sale'}
          </Badge>
          {propertyType && (
            <Badge intent="neutral" size="sm" className="capitalize text-[10px]">
              {propertyType}
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setFavorite(!favorite)
          }}
          className={`absolute top-3 right-3 z-20 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            favorite ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-surface/60 border-border/40 text-muted hover:text-text'
          }`}
        >
          ♥
        </button>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 z-20">
          <p className="text-xl font-extrabold text-text font-display drop-shadow-md">
            {price > 0 ? formatRupee(price) : 'Not specified'}
            {price > 0 && type === 'rent' && <span className="text-xs font-normal text-muted">/mo</span>}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-bold text-text text-base group-hover:text-primary transition-colors line-clamp-1">
          {name}
        </h4>
        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3 text-primary shrink-0" />
          {city ?? 'Hyderabad'}, India
        </p>

        {description && (
          <p className="mt-2 text-xs text-text2 line-clamp-2 leading-relaxed flex-1">
            {description}
          </p>
        )}

        <div className="mt-3 py-2 border-t border-border/40 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-3">
            {bedrooms && (
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3 text-primary" /> {bedrooms} BHK
              </span>
            )}
            {bathrooms && <span>🛁 {bathrooms} Bath</span>}
            {areaSqFt && <span>📐 {areaSqFt} sq ft</span>}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between pt-2">
          <span className="text-[11px] text-muted">Owner: <strong className="text-text font-medium">{ownerName ?? 'Verified Owner'}</strong></span>
          <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary group-hover:bg-primary/10">
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
