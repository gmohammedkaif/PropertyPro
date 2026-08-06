import { useState } from 'react'
import { CheckCircle, Clock, DollarSign, CreditCard } from 'lucide-react'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useToast } from '@/hooks/useToast'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function TenantRentPage() {
  const user = useAuthStore((state) => state.user)
  const { items: tenancies } = useTenanciesStore()
  const { items: payments, update } = usePaymentsStore()
  const toast = useToast()
  const [paying, setPayingId] = useState<string | null>(null)

  const myTenancy = tenancies.find(
    (t) => t.id === user?.tenancyId || t.tenantEmail === user?.email
  )

  const myPayments = payments
    .filter((p) => p.tenantName === myTenancy?.tenantName)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  const totalPaid = myPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = myPayments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)

  const handlePay = async (paymentId: string) => {
    setPayingId(paymentId)
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1200))
    update(paymentId, { status: 'paid', paidDate: new Date().toISOString().split('T')[0] })
    toast.success('Payment successful!', { description: 'Your rent has been recorded.' })
    setPayingId(null)
  }

  if (!myTenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <DollarSign className="h-12 w-12 text-muted" />
        <h2 className="text-lg font-semibold text-text">No Active Tenancy</h2>
        <p className="text-sm text-muted">You don't have any active tenancy linked to your account.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">My Rent</h1>
        <p className="text-sm text-muted mt-0.5">Manage and pay your rent for {myTenancy.propertyName}.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard title="Monthly Rent" value={formatRupee(myTenancy.monthlyRent)} icon={DollarSign} variant="primary" />
        <StatCard title="Total Paid" value={formatRupee(totalPaid)} icon={CheckCircle} variant="success" />
        <StatCard title="Pending" value={formatRupee(totalPending)} icon={Clock} variant={totalPending > 0 ? 'warning' : 'default'} />
      </div>

      <GlassCard className="p-0">
        <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
          <GlassCardTitle>Payment History</GlassCardTitle>
          <GlassCardDescription>{myTenancy.propertyName}{myTenancy.unitNumber ? ` · Unit ${myTenancy.unitNumber}` : ''}</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="px-5 pb-5">
          {myPayments.length === 0 ? (
            <p className="text-center text-sm text-muted py-8">No payment records yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border/30">
              {myPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.status === 'paid' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text capitalize">{p.type} Payment</p>
                      <p className="text-[11px] text-muted">
                        Due {formatDate(p.dueDate)}
                        {p.paidDate ? ` · Paid ${formatDate(p.paidDate)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-text">{formatRupee(p.amount)}</span>
                    {p.status !== 'paid' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={paying === p.id}
                        onClick={() => handlePay(p.id)}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Now
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 uppercase">
                        <CheckCircle className="h-3 w-3" /> Paid
                      </span>
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
}
