import { useState, useEffect, type FormEvent } from 'react'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MapPin,
  Phone,
  Search,
  User,
  XCircle,
  IndianRupee,
  ClipboardList,
} from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { Modal } from '@/components/ui/EnhancedModal'
import { useToast } from '@/hooks/useToast'
import { useRentalRequestsStore, type RentalRequestRecord } from '@/stores/rentalRequestsStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { derivePropertyUnits } from '@/lib/unitUtils'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useAuthStore } from '@/stores/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    pending: { intent: 'warning' as const, icon: Clock },
    approved: { intent: 'success' as const, icon: CheckCircle2 },
    rejected: { intent: 'danger' as const, icon: XCircle },
  }[status] ?? { intent: 'neutral' as const, icon: Clock }
  const Icon = cfg.icon
  return (
    <Badge intent={cfg.intent} size="sm" className="capitalize font-semibold gap-1">
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  )
}

interface LeaseModalProps {
  open: boolean
  onClose: () => void
  request: RentalRequestRecord
  onConfirm: (lease: {
    leaseStart: string
    leaseDurationMonths: number
    monthlyRent: number
    securityDeposit: number
    unitNumber?: string
    leaseNotes: string
  }) => void
}

function LeaseCreationModal({ open, onClose, request, onConfirm }: LeaseModalProps) {
  const { items: properties } = useLocalPropertiesStore()
  const { items: tenancies } = useTenanciesStore()

  const targetProperty = properties.find(
    (p) => p.id === request.propertyId || p.name?.toLowerCase() === request.propertyName?.toLowerCase()
  )

  const derivedUnits = targetProperty
    ? derivePropertyUnits(targetProperty, tenancies)
    : []

  const availableUnitsList = derivedUnits.filter((u) => u.status === 'AVAILABLE')

  const requestedUnitValid = request.unitNumber && availableUnitsList.some((u) => u.unitNumber === request.unitNumber)
  const initialUnit = requestedUnitValid
    ? request.unitNumber!
    : availableUnitsList.length > 0
    ? availableUnitsList[0].unitNumber
    : 'Main'

  const selectedUnitObj = derivedUnits.find((u) => u.unitNumber.toLowerCase() === initialUnit.toLowerCase())
  const initialRent = selectedUnitObj?.monthlyRent ?? request.monthlyRent ?? targetProperty?.monthlyRent ?? 0
  const initialDeposit = selectedUnitObj?.securityDeposit ?? targetProperty?.securityDeposit ?? 0

  const [leaseStart, setLeaseStart] = useState(new Date().toISOString().split('T')[0])
  const [leaseDuration, setLeaseDuration] = useState('12')
  const [unitNumber, setUnitNumber] = useState(initialUnit)
  const [monthlyRent, setMonthlyRent] = useState(String(initialRent))
  const [securityDeposit, setSecurityDeposit] = useState(String(initialDeposit))
  const [leaseNotes, setLeaseNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sync unitNumber, rent, and deposit when target property or requested unit resolves
  useEffect(() => {
    const targetUnitName =
      request.unitNumber && availableUnitsList.some((u) => u.unitNumber === request.unitNumber)
        ? request.unitNumber
        : unitNumber || (availableUnitsList.length > 0 ? availableUnitsList[0].unitNumber : 'Main')

    const matched = derivedUnits.find((u) => u.unitNumber.toLowerCase() === (targetUnitName || unitNumber).toLowerCase())
    const r = matched?.monthlyRent ?? request.monthlyRent ?? targetProperty?.monthlyRent
    const d = matched?.securityDeposit ?? targetProperty?.securityDeposit

    if (r !== undefined && r !== null) setMonthlyRent(String(r))
    if (d !== undefined && d !== null) setSecurityDeposit(String(d))
  }, [request.propertyId, request.unitNumber, availableUnitsList.length])

  const computedEnd = (() => {
    if (!leaseStart) return ''
    const d = new Date(leaseStart)
    d.setMonth(d.getMonth() + Number(leaseDuration))
    return d.toISOString().split('T')[0]
  })()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    onConfirm({
      leaseStart,
      leaseDurationMonths: Number(leaseDuration),
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      unitNumber: unitNumber.trim() || 'Main',
      leaseNotes,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onOpenChange={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Create Lease Agreement
        </span>
      }
      description={`Lease for ${request.fullName} — ${request.propertyName}`}
      footer={
        <div className="flex items-center gap-3">
          <EnhancedButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </EnhancedButton>
          <EnhancedButton
            type="submit"
            form="lease-form"
            variant="primary"
            loading={submitting}
            shimmer
          >
            <CheckCircle2 className="h-4 w-4" /> Create Lease & Approve
          </EnhancedButton>
        </div>
      }
    >
      <form id="lease-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Tenant Summary */}
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface2/40 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {request.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-text">{request.fullName}</p>
            <p className="text-xs text-muted">{request.tenantEmail} · {request.mobileNumber}</p>
            <p className="text-xs text-muted mt-0.5">
              <MapPin className="h-3 w-3 inline mr-0.5" />{request.city} ·
              Requested: <Building2 className="h-3 w-3 inline mx-0.5" />{request.propertyName}
            </p>
          </div>
        </div>

        {/* Lease Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Lease Start Date
            </label>
            <input
              type="date"
              required
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Lease Duration
            </label>
            <select
              value={leaseDuration}
              onChange={(e) => setLeaseDuration(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            >
              <option value="6">6 Months</option>
              <option value="11">11 Months</option>
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
            </select>
          </div>
        </div>

        {computedEnd && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            Lease End Date: <span className="font-bold ml-1">{fmt(computedEnd)}</span>
          </div>
        )}

        {/* Unit Identifier */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
            Assign Property Unit / Identifier
          </label>
          {availableUnitsList.length > 0 ? (
            <select
              value={unitNumber}
              onChange={(e) => {
                const selected = e.target.value
                setUnitNumber(selected)
                const matched = derivedUnits.find((u) => u.unitNumber.toLowerCase() === selected.toLowerCase())
                if (matched?.monthlyRent !== undefined && matched?.monthlyRent !== null) {
                  setMonthlyRent(String(matched.monthlyRent))
                }
                if (matched?.securityDeposit !== undefined && matched?.securityDeposit !== null) {
                  setSecurityDeposit(String(matched.securityDeposit))
                }
              }}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            >
              {availableUnitsList.map((u) => (
                <option key={u.unitNumber} value={u.unitNumber}>
                  {u.unitNumber} ({u.floor}) — Available
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Main or A-101"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          )}
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Monthly Rent (₹)
            </label>
            <input
              type="number"
              required
              min={1000}
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
              Security Deposit (₹)
            </label>
            <input
              type="number"
              required
              min={0}
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-xl border border-border/60 bg-surface2/30 p-4 flex items-center justify-around text-center">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Monthly Rent</p>
            <p className="text-lg font-bold text-text">{fmtCurrency(Number(monthlyRent) || 0)}</p>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Security Deposit</p>
            <p className="text-lg font-bold text-text">{fmtCurrency(Number(securityDeposit) || 0)}</p>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Total Move-in</p>
            <p className="text-lg font-bold text-emerald-400">
              {fmtCurrency((Number(monthlyRent) || 0) + (Number(securityDeposit) || 0))}
            </p>
          </div>
        </div>

        {/* Lease Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
            Lease Notes <span className="text-muted font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Any special conditions, maintenance responsibilities, parking rules…"
            value={leaseNotes}
            onChange={(e) => setLeaseNotes(e.target.value)}
            className="glass-input w-full resize-none min-h-[80px]"
          />
        </div>
      </form>
    </Modal>
  )
}

// ─── Request Details Modal ────────────────────────────────────────────────────

function RequestDetailsModal({
  open,
  onClose,
  request,
  onApprove,
  onReject,
}: {
  open: boolean
  onClose: () => void
  request: RentalRequestRecord
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onClose}
      size="md"
      title="Request Details"
      description="Full rental request information"
      footer={
        request.status === 'pending' ? (
          <div className="flex gap-2">
            <EnhancedButton type="button" variant="danger" size="sm" onClick={() => { onReject(); onClose() }}>
              <XCircle className="h-4 w-4" /> Reject
            </EnhancedButton>
            <EnhancedButton type="button" variant="primary" size="sm" shimmer onClick={() => { onApprove(); onClose() }}>
              <CheckCircle2 className="h-4 w-4" /> Approve & Create Lease
            </EnhancedButton>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        {/* Tenant profile */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 border border-primary/20 text-primary text-xl font-bold shrink-0">
            {request.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-text">{request.fullName}</p>
            <p className="text-sm text-muted">{request.tenantEmail}</p>
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Fields */}
        {[
          { label: 'Mobile Number', value: request.mobileNumber, icon: Phone },
          { label: 'City', value: request.city, icon: MapPin },
          { label: 'Requested Property', value: request.propertyName, icon: Building2 },
          { label: 'Request Date', value: fmt(request.createdAt), icon: Calendar },
          { label: 'Monthly Rent', value: request.monthlyRent ? fmtCurrency(request.monthlyRent) : '—', icon: IndianRupee },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start justify-between py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wider">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <span className="text-sm font-semibold text-text">{value}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TenantRequestsPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()

  const { items: allRentalRequests, approveRequest, rejectRequest, fetch: fetchRequests } = useRentalRequestsStore()
  const { add: addTenancy } = useTenanciesStore()
  const { items: allProperties, occupyUnits, setListingStatus } = useLocalPropertiesStore()
  const { add: addPayment } = usePaymentsStore()
  const { addNotification } = useNotificationsStore()

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'

  const myOwnerProperties = allProperties.filter(
    (p) => p.ownerEmail?.toLowerCase() === userEmail || p.ownerId === userId,
  )
  const myPropertyIds = new Set(myOwnerProperties.map((p) => p.id))
  const myPropertyNames = new Set(myOwnerProperties.map((p) => p.name.toLowerCase()))

  const rentalRequests = isSuperAdmin
    ? allRentalRequests
    : allRentalRequests.filter(
        (r) =>
          r.ownerEmail?.toLowerCase() === userEmail ||
          r.ownerId === userId ||
          myPropertyIds.has(r.propertyId) ||
          myPropertyNames.has(r.propertyName.toLowerCase()),
      )

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<RentalRequestRecord | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [leaseOpen, setLeaseOpen] = useState(false)
  const [pendingApproval, setPendingApproval] = useState<RentalRequestRecord | null>(null)
  const [rejectingIds, setRejectingIds] = useState<Record<string, boolean>>({})

  const filtered = rentalRequests.filter((req) => {
    const search_ = search.toLowerCase()
    const matchSearch =
      !search_ ||
      req.fullName.toLowerCase().includes(search_) ||
      req.propertyName.toLowerCase().includes(search_) ||
      req.tenantEmail.toLowerCase().includes(search_) ||
      req.city.toLowerCase().includes(search_)
    const matchStatus = filterStatus === 'all' || req.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingCount = rentalRequests.filter((r) => r.status === 'pending').length

  const handleApproveClick = (req: RentalRequestRecord) => {
    setPendingApproval(req)
    setLeaseOpen(true)
  }

  const handleRejectClick = async (req: RentalRequestRecord) => {
    if (rejectingIds[req.id]) return
    setRejectingIds((prev) => ({ ...prev, [req.id]: true }))
    try {
      await rejectRequest(req.id)
      toast.info(`Rejected request from ${req.fullName}`)
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request')
    } finally {
      setRejectingIds((prev) => {
        const next = { ...prev }
        delete next[req.id]
        return next
      })
    }
  }

  const handleLeaseConfirm = async (lease: {
    leaseStart: string
    leaseDurationMonths: number
    monthlyRent: number
    securityDeposit: number
    unitNumber?: string
    leaseNotes: string
  }) => {
    if (!pendingApproval) return
    const req = pendingApproval

    try {
      await approveRequest(req.id, {
        leaseStart: lease.leaseStart,
        leaseDurationMonths: lease.leaseDurationMonths,
        monthlyRent: lease.monthlyRent,
        securityDeposit: lease.securityDeposit,
        unitNumber: lease.unitNumber,
        leaseNotes: lease.leaseNotes || undefined,
      })
      // Sync requests, properties, leases, and payments
      fetchRequests()
      useLocalPropertiesStore.getState().fetch()
      useTenanciesStore.getState().fetch()
      usePaymentsStore.getState().fetch()
      
      toast.success(`Lease created for ${req.fullName}! Property marked as occupied.`)
      setPendingApproval(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" /> Tenant Requests
            </h1>
            {pendingCount > 0 && (
              <Badge intent="warning" size="md" className="font-bold">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted mt-1">
            Review and manage rental requests from prospective tenants. Approve to create a lease.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-xl border border-border/50 px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            type="text"
            placeholder="Search by tenant, property, city or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterStatus === s
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface2/50 text-text2 hover:text-text hover:bg-surface2'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2 border border-border/40">
              <Building2 className="h-8 w-8 text-muted/50" />
            </div>
            <p className="text-sm font-semibold text-text">No tenant requests found</p>
            <p className="text-xs text-muted max-w-sm">
              When tenants click "Request For Rent" on available properties, their requests appear here for your review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface2/40 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-5">Tenant</th>
                  <th className="py-3.5 px-5">Property Requested</th>
                  <th className="py-3.5 px-5">Contact & City</th>
                  <th className="py-3.5 px-5">Requested On</th>
                  <th className="py-3.5 px-5">Monthly Rent</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-surface2/30 transition-colors group">
                    {/* Tenant */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-text">{req.fullName}</p>
                          <p className="text-[11px] text-muted font-mono">{req.tenantEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {req.propertyName}
                      </div>
                      {req.propertyType && (
                        <p className="text-[11px] text-muted capitalize">{req.propertyType}</p>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-5">
                      <p className="text-sm text-text">{req.mobileNumber}</p>
                      <p className="text-[11px] text-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {req.city}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-xs text-text2">{fmt(req.createdAt)}</td>

                    {/* Rent */}
                    <td className="py-4 px-5 text-sm font-semibold text-text tabular-nums">
                      {req.monthlyRent ? fmtCurrency(req.monthlyRent) : '—'}/mo
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedRequest(req); setDetailsOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        {req.status === 'pending' && (
                          <>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveClick(req)}
                              disabled={Object.values(rejectingIds).some(Boolean)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => handleRejectClick(req)}
                              loading={rejectingIds[req.id]}
                              disabled={Object.values(rejectingIds).some(Boolean)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {req.status !== 'pending' && (
                          <span className="text-xs text-muted italic">Processed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          request={selectedRequest}
          onApprove={() => handleApproveClick(selectedRequest)}
          onReject={() => handleRejectClick(selectedRequest)}
        />
      )}

      {/* Lease Creation Modal */}
      {pendingApproval && (
        <LeaseCreationModal
          open={leaseOpen}
          onClose={() => { setLeaseOpen(false); setPendingApproval(null) }}
          request={pendingApproval}
          onConfirm={handleLeaseConfirm}
        />
      )}
    </div>
  )
}
