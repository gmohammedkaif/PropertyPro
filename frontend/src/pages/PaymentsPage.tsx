import { useState, type FormEvent } from 'react'
import {
  DollarSign,
  Plus,
  Search,
  Trash2,
  Edit,
  TrendingUp,
  FileCheck2,
  Clock,
} from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { ActionsMenu } from '@/components/ui/ActionsMenu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { useToast } from '@/hooks/useToast'
import { usePaymentsStore, type PaymentRecord, type PaymentStatus, type PaymentType } from '@/stores/paymentsStore'
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { cn } from '@/lib/utils'
import { useConfirmStore } from '@/stores/confirmStore'

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)
}

function getTenantContact(name: string): { phone: string; email: string } {
  const clean = name.toLowerCase()
  if (clean === 'fttt') return { phone: '9978543215', email: 'ft@gmail.com' }
  if (clean === 'mohan') return { phone: '9898989898', email: 'mohan@gmail.com' }
  if (clean === 'ram') return { phone: '9008989898', email: 'ram@gmail.com' }
  if (clean === 'mohammed') return { phone: '8765456789', email: 'mohammed@gmail.com' }
  return { phone: '99999 88888', email: `${clean}@gmail.com` }
}

function getTransactionId(id: string): string {
  return `TXN-${id.replace('pay_', '').slice(0, 6).toUpperCase()}`
}

export function PaymentsPage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const { items: allPayments, add, update, remove } = usePaymentsStore()
  const { items: properties } = useLocalPropertiesStore()
  const { items: tenancies } = useTenanciesStore()

  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const userName = user?.name?.toLowerCase() ?? ''
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  const myOwnerProperties = properties.filter(
    (p) => p.ownerEmail?.toLowerCase() === userEmail || p.ownerId === userId,
  )
  const myPropertyNames = new Set(myOwnerProperties.map((p) => p.name.toLowerCase()))

  const myTenancies = tenancies.filter(
    (t) =>
      t.ownerEmail?.toLowerCase() === userEmail ||
      myPropertyNames.has(t.propertyName.toLowerCase()),
  )
  const myTenantNames = new Set(myTenancies.map((t) => t.tenantName.toLowerCase()))

  const items = isSuperAdmin
    ? allPayments
    : isOwner
    ? allPayments.filter(
        (p) =>
          myPropertyNames.has(p.propertyName.toLowerCase()) ||
          myTenantNames.has(p.tenantName.toLowerCase()),
      )
    : allPayments.filter((p) => p.tenantName.toLowerCase() === userName)

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PaymentRecord | null>(null)

  // Form State
  const [tenantName, setTenantName] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [type, setType] = useState<PaymentType>('rent')
  const [notes, setNotes] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setTenantName('')
    setPropertyName('')
    setAmount('')
    setDueDate('')
    setPaidDate('')
    setStatus('pending')
    setType('rent')
    setNotes('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: PaymentRecord) => {
    setEditingItem(item)
    setTenantName(item.tenantName)
    setPropertyName(item.propertyName)
    setAmount(String(item.amount))
    setDueDate(item.dueDate)
    setPaidDate(item.paidDate ?? '')
    setStatus(item.status)
    setType(item.type)
    setNotes(item.notes ?? '')
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await useConfirmStore.getState().showConfirm({
      title: 'Remove Payment Record',
      message: 'Are you sure you want to remove this payment record?'
    })
    if (confirmed) {
      remove(id)
      toast.success('Payment record removed')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!tenantName.trim() || !propertyName.trim() || !amount || !dueDate) {
      toast.error('All required fields must be filled')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const payload = {
      tenantName: tenantName.trim(),
      propertyName: propertyName.trim(),
      amount: numAmount,
      dueDate,
      paidDate: paidDate ? paidDate : undefined,
      status,
      type,
      notes: notes.trim() || undefined,
    }

    if (editingItem) {
      update(editingItem.id, payload)
      toast.success('Payment record updated')
    } else {
      add(payload)
      toast.success('Payment record created')
    }
    setModalOpen(false)
  }

  const handleMarkAsPaid = (item: PaymentRecord) => {
    update(item.id, {
      status: 'paid',
      paidDate: new Date().toISOString().slice(0, 10),
    })
    toast.success('Marked as paid')
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const revenuePaid = items.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const pendingCollections = items.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0)
  const overdueTotal = items.filter((item) => item.status === 'overdue' || (item.status === 'pending' && new Date(item.dueDate) < new Date())).reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Payments</h1>
          <p className="text-sm text-muted">Track rental billing, collections history, invoices, and accounting balance sheets.</p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Record Payment
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Collections" value={formatCurrency(revenuePaid)} icon={TrendingUp} variant="success" />
        <StatCard title="Pending Payments" value={formatCurrency(pendingCollections)} icon={Clock} variant="warning" />
        <StatCard title="Overdue Rent" value={formatCurrency(overdueTotal)} icon={DollarSign} variant="danger" />
        <StatCard title="Transactions Filed" value={String(items.length)} icon={FileCheck2} variant="primary" />
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search payments..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: 'all', label: 'All Status' },
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

      {/* Data Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted">
                  No payment invoices or collections records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const initials = item.tenantName.slice(0, 2).toUpperCase()
                const contact = getTenantContact(item.tenantName)
                const txnId = getTransactionId(item.id)
                
                return (
                  <TableRow key={item.id} className="hover:bg-surface2/30 transition-all">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-text">{item.tenantName}</span>
                          <span className="text-xs text-muted">{item.propertyName}</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-400 border border-sky-500/15">
                              {item.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      <div className="flex flex-col">
                        <span>{contact.phone}</span>
                        <span>{contact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text2">{txnId}</TableCell>
                    <TableCell className="text-xs text-muted">
                      <div className="flex flex-col">
                        {item.status === 'paid' ? (
                          <>
                            <span className="text-text2">Paid Date:</span>
                            <span>{new Date(item.paidDate ?? item.dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-text2">Due Date:</span>
                            <span>{new Date(item.dueDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-success">₹{item.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge
                        intent={
                          item.status === 'paid'
                            ? 'success'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionsMenu
                        items={[
                          ...(item.status !== 'paid'
                            ? [
                                {
                                  label: 'Mark as Paid',
                                  onClick: () => handleMarkAsPaid(item),
                                },
                              ]
                            : []),
                          {
                            label: 'Edit Record',
                            icon: Edit,
                            onClick: () => handleOpenEdit(item),
                          },
                          {
                            label: 'Remove Invoice',
                            icon: Trash2,
                            destructive: true,
                            onClick: () => handleDelete(item.id),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingItem ? 'Edit Payment Record' : 'Record New Payment'}
        description="Log transaction details for invoicing and billing sheets."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Record</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <Input
            label="Tenant Name"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            required
          />
          <Input
            label="Property Name"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="e.g. Hassan Villa"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Type"
              options={[
                { value: 'rent', label: 'Rent' },
                { value: 'deposit', label: 'Security Deposit' },
                { value: 'maintenance', label: 'Maintenance Fee' },
                { value: 'other', label: 'Other Charges' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
            />
            <Select
              label="Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="45000"
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <Input
              label="Paid Date"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text2">Notes</label>
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bank Transfer Ref: Txn12345"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
