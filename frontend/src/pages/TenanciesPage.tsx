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
  Phone,
  Mail,
  Home,
  MessageSquare,
  Receipt,
  FileText,
  Clock,
} from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { EnhancedInput } from '@/components/ui/EnhancedInput'
import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/ui/GlassCard'
import { StatCard } from '@/components/ui/StatCard'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { useTenanciesStore, type TenancyRecord, type TenancyStatus } from '@/stores/tenanciesStore'
import { useLocalPropertiesStore, availableUnits, isUnitBased } from '@/stores/localPropertiesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useConfirmStore } from '@/stores/confirmStore'

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

export function TenanciesPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const { items: allTenancies, add, update, remove } = useTenanciesStore()
  const { items: properties, occupyUnits, freeUnits } = useLocalPropertiesStore()
  const { items: payments } = usePaymentsStore()

  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  const myOwnerProperties = properties.filter(
    (p) => p.ownerEmail?.toLowerCase() === userEmail || p.ownerId === userId,
  )
  const myPropertyIds = new Set(myOwnerProperties.map((p) => p.id))
  const myPropertyNames = new Set(myOwnerProperties.map((p) => p.name.toLowerCase()))

  const items = isSuperAdmin
    ? allTenancies
    : isOwner
    ? allTenancies.filter(
        (t) =>
          t.ownerEmail?.toLowerCase() === userEmail ||
          myPropertyIds.has(t.propertyId) ||
          myPropertyNames.has(t.propertyName.toLowerCase()),
      )
    : allTenancies.filter((t) => t.tenantEmail.toLowerCase() === userEmail)

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TenancyRecord | null>(null)
  
  // Quick View modals
  const [selectedTenancy, setSelectedTenancy] = useState<TenancyRecord | null>(null)
  const [leaseDetailsOpen, setLeaseDetailsOpen] = useState(false)
  const [paymentsLedgerOpen, setPaymentsLedgerOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState('')

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

  // Dynamically calculate tenant status from payments
  const getTenantPaymentStatus = (name: string): 'Paid' | 'Pending' | 'Overdue' => {
    const tenantPayments = payments.filter((p) => p.tenantName.toLowerCase() === name.toLowerCase())
    if (tenantPayments.length === 0) return 'Paid'
    const overdue = tenantPayments.some((p) => p.status === 'overdue')
    if (overdue) return 'Overdue'
    const pending = tenantPayments.some((p) => p.status === 'pending')
    if (pending) return 'Pending'
    return 'Paid'
  }

  // Calculate outstanding balance
  const getOutstandingBalance = (name: string): number => {
    return payments
      .filter((p) => p.tenantName.toLowerCase() === name.toLowerCase() && p.status !== 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
  }

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
      message: `Are you sure you want to end & remove lease for "${name}"?`,
    })
    if (confirmed) {
      try {
        await remove(id)
        freeUnits(propertyId, units)
        toast.success('Lease record removed successfully')
      } catch (err: any) {
        toast.error('Failed to end lease')
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!tenantName.trim() || !selectedPropertyId || !leaseStart || !leaseEnd) {
      toast.error('All required fields must be filled')
      return
    }
    const prop = properties.find((p) => p.id === selectedPropertyId)
    if (!prop) {
      toast.error('Invalid property selected')
      return
    }

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

    try {
      if (editingItem) {
        await update(editingItem.id, payload)
        toast.success('Tenancy details updated')
      } else {
        await add(payload)
        occupyUnits(prop.id, units)
        toast.success('New tenancy lease activated')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(editingItem ? 'Failed to update tenancy' : 'Failed to activate tenancy')
    }
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) return
    toast.success(`Message sent to ${selectedTenancy?.tenantName} successfully!`, {
      description: `Message: "${messageText.substring(0, 30)}..."`,
    })
    setMessageText('')
    setMessageOpen(false)
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
      matchesStatus = getTenantPaymentStatus(item.tenantName) !== 'Paid' && item.status === 'active'
    }
    
    return matchesSearch && matchesStatus
  })

  // Stats
  const activeTenancies = items.filter((item) => item.status === 'active').length
  const totalOutstanding = items
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => sum + getOutstandingBalance(item.tenantName), 0)
  const totalRentExpected = items
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => sum + item.monthlyRent, 0)

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header Section */}
      <GlassCard hover animated className="overflow-hidden">
        <GlassCardHeader className="p-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" /> Active Tenants
              </h1>
              <p className="text-sm text-muted">Manage active leases, tenant profiles, financial ledger, and agreements.</p>
            </div>

            <EnhancedButton onClick={handleOpenAdd} glowIntensity="high" shimmer>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Tenant
            </EnhancedButton>
          </div>
        </GlassCardHeader>

        <GlassCardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Leases" value={String(items.length)} icon={Users} variant="primary" />
            <StatCard title="Active Tenants" value={String(activeTenancies)} icon={ShieldCheck} variant="success" />
            <StatCard title="Outstanding Rent" value={formatCurrency(totalOutstanding)} icon={Clock} variant="danger" />
            <StatCard title="Expected Monthly Rent" value={formatCurrency(totalRentExpected)} icon={DollarSign} variant="secondary" />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Toolbar & Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <EnhancedInput
              placeholder="Search tenants or property name..."
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
              { value: 'paid', label: 'Paid up' },
              { value: 'pending', label: 'Overdue / Pending' },
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

      {/* Premium Tenant Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <GlassCard className="max-w-md mx-auto p-8 flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-muted" />
              <p className="text-text font-bold text-lg">No Tenants Found</p>
              <p className="text-muted text-sm">No tenancy records match your current search filters.</p>
              <EnhancedButton onClick={handleOpenAdd} size="sm">
                <Plus className="h-4 w-4" /> Add Tenant
              </EnhancedButton>
            </GlassCard>
          </div>
        ) : (
          filtered.map((item) => {
            const initials = item.tenantName.slice(0, 2).toUpperCase()
            const payStatus = getTenantPaymentStatus(item.tenantName)
            const outstanding = getOutstandingBalance(item.tenantName)
            
            return (
              <GlassCard key={item.id} hover className="flex flex-col h-full bg-surface/50 border-border/60 justify-between">
                <GlassCardContent className="p-5 flex flex-col gap-4">
                  {/* Card Header Profile */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-sm border border-primary/20">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-text truncate">{item.tenantName}</span>
                        <span className="text-[10px] text-muted font-mono uppercase tracking-wider">Lease ID: {item.id.substring(0, 8)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge
                        intent={item.status === 'active' ? 'success' : 'neutral'}
                        size="sm"
                        className="font-semibold text-[10px]"
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                      
                      {item.status === 'active' && (
                        <Badge
                          intent={payStatus === 'Paid' ? 'success' : payStatus === 'Pending' ? 'warning' : 'danger'}
                          size="sm"
                          className="font-bold text-[10px]"
                        >
                          {payStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Property Section */}
                  <div className="flex items-center gap-2 text-xs border-y border-border/30 py-3">
                    <Home className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-text truncate">{item.propertyName}</p>
                      {item.unitNumber && <p className="text-[10px] text-muted">Unit: {item.unitNumber}</p>}
                    </div>
                  </div>

                  {/* Lease Date Timeline */}
                  <div className="flex flex-col gap-1.5 text-xs text-text2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Lease Start</span>
                      <span className="font-medium text-text">{new Date(item.leaseStart).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Lease End</span>
                      <span className="font-medium text-text">{new Date(item.leaseEnd).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Financials segment */}
                  <div className="grid grid-cols-2 gap-3 bg-surface2/30 rounded-xl p-3 border border-border/40 text-center">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Monthly Rent</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(item.monthlyRent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Outstanding</p>
                      <p className={`text-sm font-bold mt-0.5 ${outstanding > 0 ? 'text-red-400' : 'text-text'}`}>
                        {formatCurrency(outstanding)}
                      </p>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="flex flex-col gap-1.5 text-[11px] text-muted">
                    {item.tenantPhone && (
                      <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {item.tenantPhone}</span>
                    )}
                    {item.tenantEmail && (
                      <span className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" /> {item.tenantEmail}</span>
                    )}
                  </div>
                </GlassCardContent>

                {/* Card Footer Quick Actions */}
                <div className="border-t border-border/30 p-4 flex gap-1.5 shrink-0 bg-surface2/10">
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-[10px] py-1 gap-1 border border-border/60 hover:bg-surface2"
                    onClick={() => { setSelectedTenancy(item); setLeaseDetailsOpen(true) }}
                  >
                    <FileText className="h-3 w-3 text-primary" /> Lease
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-[10px] py-1 gap-1 border border-border/60 hover:bg-surface2"
                    onClick={() => { setSelectedTenancy(item); setPaymentsLedgerOpen(true) }}
                  >
                    <Receipt className="h-3 w-3 text-emerald-400" /> Payments
                  </EnhancedButton>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-[10px] py-1 gap-1 border border-border/60 hover:bg-surface2"
                    onClick={() => { setSelectedTenancy(item); setMessageOpen(true) }}
                  >
                    <MessageSquare className="h-3 w-3 text-sky-400" /> Ping
                  </EnhancedButton>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-muted hover:text-text rounded-md border border-border/60 hover:bg-surface2"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.tenantName, item.propertyId, item.unitsOccupied)}
                      className="p-1.5 text-muted hover:text-red-400 rounded-md border border-border/60 hover:bg-red-500/10 hover:border-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )
          })
        )}
      </div>

      {/* Edit/Add Form Modal */}
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
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
            {selectedProperty && isUnitBased(selectedProperty.type) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text/80 tracking-wide">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TenancyStatus)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
              >
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </fieldset>
        </div>
      </Modal>

      {/* View Lease details modal */}
      {selectedTenancy && (
        <Modal
          open={leaseDetailsOpen}
          onOpenChange={setLeaseDetailsOpen}
          title={`Agreement: ${selectedTenancy.tenantName}`}
          description={`Property Lease Agreement - ${selectedTenancy.propertyName}`}
          footer={
            <EnhancedButton variant="secondary" onClick={() => setLeaseDetailsOpen(false)}>
              Close
            </EnhancedButton>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Tenant Name</p>
              <p className="text-sm font-bold text-text">{selectedTenancy.tenantName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Start Date</p>
                <p className="text-sm font-semibold">{new Date(selectedTenancy.leaseStart).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">End Date</p>
                <p className="text-sm font-semibold">{new Date(selectedTenancy.leaseEnd).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Monthly Rent</p>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(selectedTenancy.monthlyRent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Security Deposit</p>
                <p className="text-sm font-bold text-text">{formatCurrency(selectedTenancy.securityDeposit)}</p>
              </div>
            </div>
            {selectedTenancy.leaseNotes && (
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Lease Conditions & Notes</p>
                <p className="text-xs text-text2 leading-relaxed bg-surface2/30 rounded-lg p-3 border border-border/40 mt-1">
                  {selectedTenancy.leaseNotes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* View Payments ledger modal */}
      {selectedTenancy && (
        <Modal
          open={paymentsLedgerOpen}
          onOpenChange={setPaymentsLedgerOpen}
          title={`Payment History: ${selectedTenancy.tenantName}`}
          description={`Rent payment schedule for ${selectedTenancy.propertyName}`}
          footer={
            <EnhancedButton variant="secondary" onClick={() => setPaymentsLedgerOpen(false)}>
              Close
            </EnhancedButton>
          }
        >
          <div className="flex flex-col gap-3">
            {payments.filter(p => p.tenantName.toLowerCase() === selectedTenancy.tenantName.toLowerCase()).length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No payments recorded for this tenant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {payments
                  .filter(p => p.tenantName.toLowerCase() === selectedTenancy.tenantName.toLowerCase())
                  .map(p => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-text">{p.type.toUpperCase()} - {formatCurrency(p.amount)}</p>
                        <p className="text-[10px] text-muted">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge
                        intent={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}
                        size="sm"
                        className="font-bold text-[9px] capitalize"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Ping/Send Message modal */}
      {selectedTenancy && (
        <Modal
          open={messageOpen}
          onOpenChange={setMessageOpen}
          title={`Message: ${selectedTenancy.tenantName}`}
          description={`Send message to tenant mobile ${selectedTenancy.tenantPhone}`}
          footer={
            <div className="flex gap-2 justify-end w-full">
              <EnhancedButton variant="secondary" onClick={() => setMessageOpen(false)}>
                Cancel
              </EnhancedButton>
              <EnhancedButton variant="primary" onClick={handleSendMessage}>
                Send Message
              </EnhancedButton>
            </div>
          }
        >
          <div className="flex flex-col gap-3 mt-2">
            <textarea
              className="glass-input w-full resize-none min-h-[100px]"
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="e.g. Friendly reminder: rent payment of ₹8000 is due on 1st of the month..."
            />
          </div>
        </Modal>
      )}
    </div>
  )
}