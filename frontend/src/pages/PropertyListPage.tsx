import { useState, useEffect } from 'react'

import { Building2, CheckCircle2, Plus, Users, Wrench, RefreshCw, WifiOff, Home, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { Button } from '@/components/ui/Button'
import { PropertyToolbar } from '@/components/property/PropertyToolbar'
import { PropertyTable } from '@/components/property/PropertyTable'
import { PropertyFormModal } from '@/components/property/PropertyFormModal'
import { DeletePropertyDialog } from '@/components/property/DeletePropertyDialog'
import { usePropertyTable } from '@/hooks/usePropertyTable'
import { useLocalPropertyTable } from '@/hooks/useLocalPropertyTable'
import { useAuthStore, isAdmin } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
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

  const apiTable = usePropertyTable()
  const localTable = useLocalPropertyTable()

  const [useLocalData, setUseLocalData] = useState(false)
  const [showLocalNotice, setShowLocalNotice] = useState(false)

  // Check if API is available
  useEffect(() => {
    if (apiTable.error && !useLocalData) {
      setUseLocalData(true)
      setShowLocalNotice(true)
      toast.warning('Using offline data', {
        description: 'Could not connect to server. Showing locally stored properties.',
      })
    }
    if (!apiTable.error && apiTable.data.length > 0 && useLocalData) {
      setUseLocalData(false)
      setShowLocalNotice(false)
    }
  }, [apiTable.error, apiTable.data.length, useLocalData, toast])

  // Use appropriate table
  const table = useLocalData ? localTable : apiTable

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PropertyRecord | undefined>(undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PropertyRecord | null>(null)

  // FILTER DATA: Super Admin sees all; Owner sees owned properties; Tenant sees associated rented properties
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  const displayedProperties = isSuperAdmin
    ? table.data
    : isOwner
    ? table.data.filter((p) => (p as any).ownerEmail?.toLowerCase() === userEmail.toLowerCase() || (p as any).ownerId === user?.id)
    : table.data.filter((p) => myTenancies.some((t) => t.propertyId === p.id || t.propertyName === p.name))

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
    if (useLocalData) {
      setUseLocalData(false)
      apiTable.onRetry()
    } else {
      table.onRetry()
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Offline notice */}
      {showLocalNotice && (
        <GlassCard className="border-amber-500/30 bg-amber-500/5">
          <GlassCardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-text">Offline Mode</p>
                <p className="text-xs text-muted">Showing locally stored data.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* TENANT HAS NO ASSOCIATED PROPERTIES CASE */}
      {!adminUser && displayedProperties.length === 0 ? (
        <GlassCard variant="primary" className="p-12 text-center max-w-xl mx-auto my-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-inner">
              <Home className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text">No Associated Properties</h2>
            <p className="text-sm text-muted">
              You currently do not rent or own any property in the system. Browse available properties listed by house owners and submit a rental request to connect a property to your account.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/app')}>
              Browse Available Properties <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard hover animated className="overflow-hidden">
            <GlassCardHeader className="p-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    {adminUser ? 'System Properties' : 'My Rented Properties'}
                  </h1>
                  <p className="text-sm text-muted">
                    {adminUser
                      ? 'Manage and monitor all properties across the system.'
                      : 'View details of properties currently associated with your account.'}
                  </p>
                </div>

                {adminUser && (
                  <EnhancedButton onClick={handleAddProperty} glowIntensity="high" shimmer>
                    <Plus className="h-4 w-4" /> Add Property
                  </EnhancedButton>
                )}
              </div>
            </GlassCardHeader>

            <GlassCardContent className="p-6">
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
          </GlassCard>

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
            onAddProperty={handleAddProperty}
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
        </>
      )}
    </div>
  )
}