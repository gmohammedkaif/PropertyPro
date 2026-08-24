import { useState } from 'react'

import { Building2, CheckCircle2, Plus, Users, Wrench, Home, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PropertyToolbar } from '@/components/property/PropertyToolbar'
import { PropertyTable } from '@/components/property/PropertyTable'
import { PropertyFormModal } from '@/components/property/PropertyFormModal'
import { DeletePropertyDialog } from '@/components/property/DeletePropertyDialog'
import { usePropertyTable } from '@/hooks/usePropertyTable'
import { useAuthStore, isAdmin } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useProperty } from '@/hooks/useProperty'
import { useToast } from '@/hooks/useToast'
import type { PropertyRecord } from '@/shared'

export function PropertyListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const adminUser = isAdmin(user)
  const toast = useToast()

  const { items: tenancies } = useTenanciesStore()
  const userEmail = user?.email ?? ''

  // Active tenancies for this tenant
  const myTenancies = tenancies.filter(
    (t) => (t.id === user?.tenancyId || t.tenantEmail.toLowerCase() === userEmail.toLowerCase()) && t.status === 'active'
  )

  const currentTenancy = !adminUser && myTenancies.length > 0 ? myTenancies[0] : null

  // Fetch tenant's currently occupied property details
  const { data: currentProperty, isLoading: loadingCurrentProperty } = useProperty(
    currentTenancy?.propertyId ?? '',
    !!currentTenancy
  )

  const table = usePropertyTable()

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PropertyRecord | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PropertyRecord | null>(null)

  // FILTER DATA: Super Admin sees all; Owner sees owned properties; Tenant sees all available properties (table.data is already filtered by backend)
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  const displayedProperties = isSuperAdmin
    ? table.data
    : isOwner
    ? table.data.filter((p) => (p as any).ownerEmail?.toLowerCase() === userEmail.toLowerCase() || (p as any).ownerId === user?.id)
    : table.data

  // Derived stats
  const total = displayedProperties.length
  const active = displayedProperties.filter((p) => p.status === 'active').length
  const occupied = displayedProperties.filter((p) => (p.occupiedUnits ?? 0) > 0).length
  const needsMaintenance = displayedProperties.filter((p) => p.status === 'archived').length

  const handleAddProperty = () => {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  const handleEdit = (id: string) => {
    const property = table.data.find((p) => p.id === id)
    if (!property) return
    setEditTarget(property)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    const property = table.data.find((p) => p.id === id)
    if (!property) return
    setDeleteTarget(property)
    setDeleteOpen(true)
  }

  const handleView = (id: string) => {
    navigate(`/app/properties/${id}`)
  }

  const handleRetry = () => {
    table.onRetry()
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Current Home section (Tenant WITH active rental) */}
      {currentTenancy && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-text">Your Current Home</h2>
          {loadingCurrentProperty ? (
            <div className="h-32 rounded-2xl border border-border bg-surface/50 animate-pulse flex items-center justify-center text-muted text-sm">
              Loading current home details...
            </div>
          ) : currentProperty ? (
            <GlassCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Image */}
                <div className="h-32 w-full md:w-48 rounded-xl overflow-hidden shrink-0 bg-surface2">
                  <img
                    src={currentProperty.imageUrl || (currentProperty as any).images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80'}
                    alt={currentProperty.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-text">{currentProperty.name}</h3>
                      <Badge intent="success" size="sm">Active Lease</Badge>
                    </div>
                    <p className="text-sm text-muted mb-2">
                      {currentProperty.address.line1}, {currentProperty.address.city}, {currentProperty.address.state}
                    </p>
                    <p className="text-sm text-text2 font-semibold">
                      Monthly Rent: <span className="text-emerald-400 font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(currentTenancy.monthlyRent || currentProperty.monthlyRent || 0)}</span>
                    </p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="primary" size="sm" onClick={() => navigate('/app/my-rent')}>
                      View My Rent
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/app/properties/${currentProperty.id}`)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="p-4 rounded-xl border border-border bg-surface text-sm text-muted">
              Current home details not available.
            </div>
          )}
        </div>
      )}

      {/* Main Title/Stats Card */}
      <GlassCard hover animated className="overflow-hidden">
        <GlassCardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                {adminUser ? 'System Properties' : 'Find Your Next Home'}
              </h1>
              <p className="text-sm text-muted">
                {adminUser
                  ? 'Manage and monitor all properties across the system.'
                  : 'Browse available rental properties or view your current lease.'}
              </p>
            </div>

            {adminUser && (
              <EnhancedButton onClick={handleAddProperty} glowIntensity="high" shimmer className="w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Add Property
              </EnhancedButton>
            )}
          </div>
        </GlassCardHeader>

        {adminUser && (
          <GlassCardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Associated Properties"
                value={table.isLoading ? '--' : String(total)}
                icon={Building2}
                variant="primary"
              />
              <StatCard
                title="Active"
                value={table.isLoading ? '--' : String(active)}
                icon={CheckCircle2}
                variant="success"
              />
              <StatCard
                title="Occupied Units"
                value={table.isLoading ? '--' : String(occupied)}
                icon={Users}
                variant="secondary"
              />
              <StatCard
                title="Archived"
                value={table.isLoading ? '--' : String(needsMaintenance)}
                icon={Wrench}
                variant="warning"
              />
            </div>
          </GlassCardContent>
        )}
      </GlassCard>

      {/* Marketplace subtitle */}
      {!adminUser && (
        <h2 className="text-xl font-bold tracking-tight text-text mt-2">
          {currentTenancy ? 'Other Properties Available for Rent' : 'Available Properties for Rent'}
        </h2>
      )}

      <PropertyToolbar
        search={table.searchInput}
        status={table.status}
        type={table.type}
        city={table.city}
        sort={table.sort}
        view={table.view}
        onSearch={table.setSearchInput}
        onStatusChange={table.setStatus}
        onTypeChange={table.setType}
        onCityChange={table.setCity}
        onSortChange={table.setSort}
        onViewChange={table.setView}
        onReset={table.resetFilters}
      />

      <PropertyTable
        data={displayedProperties}
        loading={table.isLoading}
        error={table.error}
        totalItems={displayedProperties.length}
        currentPage={table.currentPage}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        onRetry={handleRetry}
        onAddProperty={adminUser ? handleAddProperty : undefined}
        onView={handleView}
        onEdit={adminUser ? handleEdit : undefined}
        onDelete={adminUser ? handleDelete : undefined}
        view={table.view}
      />

      {/* Create / Edit modal */}
      <PropertyFormModal open={formOpen} onOpenChange={setFormOpen} property={editTarget} />

      {/* Delete confirmation */}
      <DeletePropertyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        property={deleteTarget}
        onDeleted={() => {}}
      />
    </div>
  )
}