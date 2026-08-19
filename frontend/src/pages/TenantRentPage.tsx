import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  DollarSign,
  CreditCard,
  Building2,
  Download,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useToast } from '@/hooks/useToast'

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

export function TenantRentPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const toast = useToast()

  const { items: tenancies } = useTenanciesStore()
  const { items: payments, update: updatePayment } = usePaymentsStore()
  const { items: properties } = useLocalPropertiesStore()

  const userEmail = user?.email ?? ''

  // Active rentals for this tenant
  const myTenancies = tenancies.filter(
    (t) => (t.id === user?.tenancyId || t.tenantEmail.toLowerCase() === userEmail.toLowerCase()) && t.status === 'active'
  )

  const [payingId, setPayingId] = useState<string | null>(null)
  const [receiptModalPayment, setReceiptModalPayment] = useState<any | null>(null)

  const handlePayRent = async (paymentId: string) => {
    setPayingId(paymentId)
    await new Promise((r) => setTimeout(r, 1000))
    updatePayment(paymentId, { status: 'paid', paidDate: new Date().toISOString().split('T')[0] })
    toast.success('Rent Paid Successfully! 🎉', { description: 'Receipt generated and sent to landlord.' })
    setPayingId(null)
  }

  const handleDownloadReceipt = (payment: any) => {
    setReceiptModalPayment(payment)
  }

  // If NO active rental -> Professional empty state
  if (myTenancies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-inner">
          <DollarSign className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text">No Active Rental</h2>
        <p className="text-sm text-muted leading-relaxed">
          You are currently not staying in any rented property. Browse available properties and submit a rental request. Once a property owner approves your request, your rental information will automatically appear here.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/app/properties')} className="font-bold shadow-md mt-2">
          Browse Properties <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
          My Rent & Payment Portal <Sparkles className="h-5 w-5 text-amber-400" />
        </h1>
        <p className="text-sm text-muted mt-0.5">Manage your monthly rent, security deposits, and download official payment receipts.</p>
      </div>

      {/* Render one card per active rented property */}
      {myTenancies.map((tenancy) => {
        const prop = properties.find((p) => p.id === tenancy.propertyId || p.name === tenancy.propertyName)

        // Payments for this tenancy
        const propPayments = payments
          .filter((p) => p.tenantName === tenancy.tenantName || p.tenantName === user?.name)
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

        const totalPaid = propPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
        const pendingPayment = propPayments.find((p) => p.status === 'pending' || p.status === 'overdue')
        const currentMonthStatus = pendingPayment ? pendingPayment.status : 'paid'

        return (
          <div key={tenancy.id} className="flex flex-col gap-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard title="Monthly Rent" value={formatRupee(tenancy.monthlyRent)} icon={DollarSign} variant="primary" />
              <StatCard title="Total Paid To Date" value={formatRupee(totalPaid)} icon={CheckCircle} variant="success" />
              <StatCard
                title="Current Rent Status"
                value={currentMonthStatus.toUpperCase()}
                icon={currentMonthStatus === 'paid' ? CheckCircle : AlertTriangle}
                variant={currentMonthStatus === 'paid' ? 'success' : 'warning'}
              />
            </div>

            {/* Rented Property Main Card */}
            <GlassCard variant="primary" className="p-0 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Property Visual */}
                <div className="relative h-48 md:h-auto md:w-56 rounded-2xl overflow-hidden bg-surface2 shrink-0 border border-border/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-surface3 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/40" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge intent="success" size="sm" className="font-semibold shadow">
                      Rented Property
                    </Badge>
                  </div>
                </div>

                {/* Property & Lease Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-text">{tenancy.propertyName}</h2>
                      <Badge intent={currentMonthStatus === 'paid' ? 'success' : 'warning'} size="md" className="capitalize font-bold">
                        Month Status: {currentMonthStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Owner: <strong className="text-text">{tenancy.ownerEmail || prop?.ownerEmail || 'Owner'}</strong> · Unit: {tenancy.unitNumber ?? 'Main'}
                    </p>
                  </div>

                  {/* Complete Field Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 my-4 py-3 border-y border-border/40 text-xs">
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Rental Start Date</span>
                      <span className="text-sm font-semibold text-text">{formatDate(tenancy.leaseStart)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Lease Duration</span>
                      <span className="text-sm font-semibold text-text">12 Months</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Lease Expiry Date</span>
                      <span className="text-sm font-semibold text-text">{formatDate(tenancy.leaseEnd)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Monthly Rent</span>
                      <span className="text-sm font-bold text-emerald-400 font-display">{formatRupee(tenancy.monthlyRent)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Advance Amount</span>
                      <span className="text-sm font-medium text-text">{formatRupee(tenancy.monthlyRent)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Security Deposit</span>
                      <span className="text-sm font-medium text-text">{formatRupee(tenancy.securityDeposit)}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Next Due Date</span>
                      <span className="text-sm font-bold text-amber-400">{pendingPayment ? formatDate(pendingPayment.dueDate) : '1st of next month'}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-semibold">Tenant Name</span>
                      <span className="text-sm font-medium text-text">{tenancy.tenantName}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/app/my-lease')}>
                      <FileText className="h-4 w-4" /> View Lease Agreement
                    </Button>
                    {propPayments.find((p) => p.status === 'paid') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadReceipt(propPayments.find((p) => p.status === 'paid'))}
                      >
                        <Download className="h-4 w-4" /> Download Latest Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Rent Payment History */}
            <GlassCard className="p-0 overflow-hidden">
              <GlassCardHeader className="px-6 pt-5 pb-3">
                <GlassCardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Rent Payment History
                </GlassCardTitle>
                <GlassCardDescription>All previous rent transactions, receipts, and pending invoices.</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="px-6 pb-6">
                {propPayments.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">No payment history available.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border/30">
                    {propPayments.map((p) => (
                      <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {p.status === 'paid' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text capitalize">{p.type} Payment</p>
                            <p className="text-xs text-muted">
                              Due Date: {formatDate(p.dueDate)}
                              {p.paidDate && <span className="text-emerald-400 font-medium"> · Paid on {formatDate(p.paidDate)}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="text-base font-extrabold text-text font-display tabular-nums">{formatRupee(p.amount)}</span>
                          {p.status !== 'paid' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              loading={payingId === p.id}
                              onClick={() => handlePayRent(p.id)}
                              className="font-bold shadow"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Pay Now
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge intent="success" size="sm" className="uppercase font-semibold">
                                Paid
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                                onClick={() => handleDownloadReceipt(p)}
                              >
                                <Download className="h-3.5 w-3.5" /> Receipt
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </div>
        )
      })}

      {/* RECEIPT PREVIEW / DOWNLOAD MODAL */}
      <Modal open={!!receiptModalPayment} onOpenChange={(open) => !open && setReceiptModalPayment(null)}>
        {receiptModalPayment && (
          <div className="p-6 flex flex-col gap-4 max-w-md w-full">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Official Rent Receipt
              </h3>
              <Badge intent="success" size="sm">
                PAID
              </Badge>
            </div>

            <div className="flex flex-col gap-3 text-xs bg-surface2/40 p-4 rounded-xl border border-border/40 font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Receipt No:</span>
                <span className="text-text font-bold">RCP-{receiptModalPayment.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tenant Name:</span>
                <span className="text-text font-bold">{receiptModalPayment.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment Type:</span>
                <span className="text-text uppercase font-bold">{receiptModalPayment.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount Paid:</span>
                <span className="text-emerald-400 font-bold text-sm">{formatRupee(receiptModalPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment Date:</span>
                <span className="text-text">{formatDate(receiptModalPayment.paidDate ?? new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span className="text-emerald-400 font-bold">COMPLETED</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setReceiptModalPayment(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  toast.success('Downloading Receipt PDF…')
                  setReceiptModalPayment(null)
                }}
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
