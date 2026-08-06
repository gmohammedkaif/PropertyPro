import { useState, type FormEvent } from 'react'
import {
  Calendar,
  DollarSign,
  Plus,
  Search,
  Trash2,
  Edit,
  Users,
  ShieldCheck,
} from 'lucide-react'

import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { Modal } from '@/components/ui/EnhancedModal'
import { useToast } from '@/hooks/useToast'
import { useTenanciesStore, type TenancyRecord, type TenancyStatus } from '@/stores/tenanciesStore'
import { useLocalPropertiesStore, availableUnits, isUnitBased } from '@/stores/localPropertiesStore'
import { cn } from '@/lib/utils'
import { useConfirmStore } from '@/stores/confirmStore'

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

function getTenantPaymentStatus(name: string): 'Paid' | 'Pending' {
  if (name.toLowerCase() === 'mohammed') return 'Pending'
  return 'Paid'
}

export function TenanciesPage() {
  const toast = useToast()
  const { items, add, update, remove } = useTenanciesStore()
  const { items: properties, occupyUnits, freeUnits } = useLocalPropertiesStore()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TenancyRecord | null>(null)

  // Form State
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [unitsRequested, setUnitsRequested] = useState('1')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [status, setStatus] = useState<TenancyStatus>('active')

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  const handleOpenAdd = () => {
    setEditingItem(null)
    setTenantName('')
    setTenantEmail('')
    setTenantPhone('')
    setSelectedPropertyId('')
    setUnitNumber('')
    setUnitsRequested('1')
    setLeaseStart('')
    setLeaseEnd('')
    setMonthlyRent('')
    setSecurityDeposit('')
    setStatus('active')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: TenancyRecord) => {
    setEditingItem(item)
    setTenantName(item.tenantName)
    setTenantEmail(item.tenantEmail)
    setTenantPhone(item.tenantPhone)
    setSelectedPropertyId(item.propertyId)
    setUnitNumber(item.unitNumber ?? '')
    setUnitsRequested(String(item.unitsOccupied))
    setLeaseStart(item.leaseStart)
    setLeaseEnd(item.leaseEnd)
    setMonthlyRent(String(item.monthlyRent))
    setSecurityDeposit(String(item.securityDeposit))
    setStatus(item.status)
    setModalOpen(true)
  }

  const handleDelete = async (id: string, name: string, propertyId: string, units: number) => {
    const confirmed = await useConfirmStore.getState().showConfirm({
      title: 'End & Remove Lease',
      message: `Are you sure you want to end & remove lease for "${name}"?`
    })
    if (confirmed) {
      remove(id)
      freeUnits(propertyId, units)
      toast.success('Lease record removed')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!tenantName.trim() || !selectedPropertyId || !leaseStart || !leaseEnd) {
      toast.error('All required fields must be filled')
      return
    }
    const prop = properties.find((p) => p.id === selectedPropertyId)
    if (!prop) { toast.error('Invalid property selected'); return }

    const rent = parseFloat(monthlyRent)
    const deposit = parseFloat(securityDeposit)
    if (isNaN(rent) || rent <= 0 || isNaN(deposit) || deposit < 0) {
      toast.error('Please enter valid numerical rent & deposit values')
      return
    }

    const units = isUnitBased(prop.type) ? Math.max(1, parseInt(unitsRequested) || 1) : 1
    const avail = availableUnits(prop)

    if (!editingItem && units > avail) {
      toast.error(`Only ${avail} unit(s) available in ${prop.name}`)
      return
    }

    const payload = {
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.trim(),
      tenantPhone: tenantPhone.trim(),
      propertyId: prop.id,
      propertyName: prop.name,
      unitNumber: unitNumber.trim() || undefined,
      unitsOccupied: units,
      leaseStart,
      leaseEnd,
      monthlyRent: rent,
      securityDeposit: deposit,
      status,
    }

    if (editingItem) {
      update(editingItem.id, payload)
      toast.success('Tenancy details updated')
    } else {
      add(payload)
      occupyUnits(prop.id, units)
      toast.success('New tenancy lease activated')
    }
    setModalOpen(false)
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = item.status === 'active'
    } else if (statusFilter === 'moved-out') {
      matchesStatus = item.status !== 'active'
    } else if (statusFilter === 'paid') {
      matchesStatus = getTenantPaymentStatus(item.tenantName) === 'Paid' && item.status === 'active'
    } else if (statusFilter === 'pending') {
      matchesStatus = getTenantPaymentStatus(item.tenantName) === 'Pending' && item.status === 'active'
    }
    
    return matchesSearch && matchesStatus
  })

  // Stats
  const activeTenancies = items.filter((item) => item.status === 'active').length
  const totalRentCollected = items
    .filter((item) => item.status === 'active' && getTenantPaymentStatus(item.tenantName) === 'Paid')
    .reduce((sum, item) => sum + item.monthlyRent, 0)
  const movedOutCount = items.filter((item) => item.status !== 'active').length

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <GlassCard hover animated className="overflow-hidden">
        <GlassCardHeader className="p-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-text">Tenants</h1>
              <p className="text-sm text-muted">Manage active leases, tenant information, and rent agreements.</p>
            </div>

            <EnhancedButton onClick={handleOpenAdd} glowIntensity="high" shimmer>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Tenant
            </EnhancedButton>
          </div>
        </GlassCardHeader>

        <GlassCardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Tenants" value={String(items.length)} icon={Users} variant="primary" />
            <StatCard title="Active Tenants" value={String(activeTenancies)} icon={ShieldCheck} variant="success" />
            <StatCard title="Moved Out" value={String(movedOutCount)} icon={Calendar} variant="warning" />
            <StatCard title="Monthly Rent Collected" value={formatCurrency(totalRentCollected)} icon={DollarSign} variant="secondary" />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Toolbar & Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <EnhancedInput
              placeholder="Search tenants..."
              value={search}
              leftIcon={<Search className="h-4 w-4" />}
              onChange={(e) => setSearch(e.target.value)}
              size="md"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'moved-out', label: 'Moved Out' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 border',
                  statusFilter === tab.value
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-surface/50 border-border text-muted hover:text-text hover:bg-surface2/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Data Table */}
      <GlassCard hover animated className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-surface2/50 backdrop-blur-md">
              <tr className="border-b border-border/60">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Tenant</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Property</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Contact</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Move-in</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Rent</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-muted">No tenants found matching this criteria.</p>
                      <EnhancedButton onClick={handleOpenAdd} size="sm">
                        <Plus className="h-4 w-4" /> Add Tenant
                      </EnhancedButton>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const initials = item.tenantName.slice(0, 2).toUpperCase()
                  const paymentStatus = getTenantPaymentStatus(item.tenantName)
                  
                  return (
                    <tr key={item.id} className="border-b border-border/40 hover:bg-surface2/30 transition-all">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-text">{item.tenantName}</span>
                            <span className="text-[10px] text-muted font-mono">ID: {item.id.replace('tnc_', '').slice(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-text font-medium">{item.propertyName}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted">
                        <div className="flex flex-col">
                          <span>{item.tenantPhone}</span>
                          <span>{item.tenantEmail}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-text2">
                        {new Date(item.leaseStart).toLocaleDateString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-success">₹{item.monthlyRent.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-muted">Dep: ₹{item.securityDeposit.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ",
                            item.status === 'active'
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          )}>
                            {item.status === 'active' ? 'Active' : 'Moved Out'}
                          </span>
                          {item.status === 'active' && (
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ",
                              paymentStatus === 'Paid'
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}>
                              {paymentStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EnhancedButton
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleOpenEdit(item)}
                            className="hover:bg-primary/20 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </EnhancedButton>
                          <EnhancedButton
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(item.id, item.tenantName, item.propertyId, item.unitsOccupied)}
                            className="hover:bg-danger/20 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </EnhancedButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingItem ? 'Edit Tenancy Details' : 'Activate New Lease'}
        description="Fill tenant and lease terms to activate tenancy."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <EnhancedButton variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </EnhancedButton>
            <EnhancedButton onClick={handleSubmit}>Save Lease</EnhancedButton>
          </div>
        }
      >
        <div className="flex flex-col gap-6 mt-2 max-h-[70vh] overflow-y-auto px-1">
          <fieldset className="flex flex-col gap-4">
            <legend className="text-xs font-semibold text-muted uppercase tracking-wider">Tenant Info</legend>
            <EnhancedInput
              label="Tenant Name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              required
              focusColor="primary"
            />
            <div className="grid grid-cols-2 gap-4">
              <EnhancedInput
                label="Email"
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="tenant@email.com"
                focusColor="primary"
              />
              <EnhancedInput
                label="Phone"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                focusColor="primary"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-t border-border/60 pt-4">
            <legend className="text-xs font-semibold text-muted uppercase tracking-wider">Lease Details</legend>
            <div className="grid grid-cols-2 gap-4">
              {/* Property dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text2">
                  Property <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
                >
                  <option value="">Select property…</option>
                  {properties.map((p) => {
                    const avail = availableUnits(p)
                    const full = avail === 0
                    return (
                      <option key={p.id} value={p.id} disabled={full && !editingItem}>
                        {p.name} — {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                        {isUnitBased(p.type) ? ` (${avail} unit${avail !== 1 ? 's' : ''} free)` : full ? ' (Occupied)' : ' (Available)'}
                      </option>
                    )
                  })}
                </select>
              </div>
              <EnhancedInput
                label="Unit Number"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. A-101"
                focusColor="primary"
              />
            </div>
            {/* Units requested — only for apartment/commercial/mixed */}
            {selectedProperty && isUnitBased(selectedProperty.type) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text2">
                  Units Requested
                  <span className="ml-2 text-muted font-normal">(max {availableUnits(selectedProperty)})</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={availableUnits(selectedProperty)}
                  value={unitsRequested}
                  onChange={(e) => setUnitsRequested(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <EnhancedInput
                label="Lease Start"
                type="date"
                value={leaseStart}
                onChange={(e) => setLeaseStart(e.target.value)}
                required
                focusColor="primary"
              />
              <EnhancedInput
                label="Lease End"
                type="date"
                value={leaseEnd}
                onChange={(e) => setLeaseEnd(e.target.value)}
                required
                focusColor="primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <EnhancedInput
                label="Monthly Rent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="45000"
                required
                focusColor="primary"
              />
              <EnhancedInput
                label="Security Deposit"
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                placeholder="90000"
                required
                focusColor="primary"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TenancyStatus)}
              className="glass-input w-full"
            >
              <option value="active">Active</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </fieldset>
        </div>
      </Modal>
    </div>
  )
}