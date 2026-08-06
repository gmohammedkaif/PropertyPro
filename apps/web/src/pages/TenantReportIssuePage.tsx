import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle, Wrench, Droplets, Zap, Wifi } from 'lucide-react'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { useToast } from '@/hooks/useToast'

type IssueCategory = 'plumbing' | 'electrical' | 'internet' | 'structure' | 'other'

const CATEGORIES: { value: IssueCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'electrical', label: 'Electrical', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'internet', label: 'Internet / Cable', icon: Wifi, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'structure', label: 'Structure / Wall', icon: Wrench, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { value: 'other', label: 'Other', icon: AlertTriangle, color: 'text-muted bg-surface2/60 border-border' },
]

export function TenantReportIssuePage() {
  const user = useAuthStore((state) => state.user)
  const { items: tenancies } = useTenanciesStore()
  const { add } = useMaintenanceStore()
  const toast = useToast()

  const myTenancy = tenancies.find(
    (t) => t.id === user?.tenancyId || t.tenantEmail === user?.email
  )

  const [category, setCategory] = useState<IssueCategory>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    add({
      propertyName: myTenancy
        ? `${myTenancy.propertyName}${myTenancy.unitNumber ? ` · Unit ${myTenancy.unitNumber}` : ''}`
        : 'My Property',
      reportedBy: myTenancy?.tenantName ?? user?.name ?? 'Tenant',
      title: `[${category.toUpperCase()}] ${title.trim()}`,
      description: description.trim() || undefined,
      priority: 'medium',
      status: 'open',
    })
    toast.success('Issue reported!', { description: 'The landlord has been notified.' })
    setLoading(false)
    setSubmitted(true)
    setTitle('')
    setDescription('')
    setCategory('other')
    setTimeout(() => setSubmitted(false), 4000)
  }

  if (!myTenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-muted" />
        <h2 className="text-lg font-semibold text-text">No Active Tenancy</h2>
        <p className="text-sm text-muted">You need an active tenancy to report issues.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Report an Issue</h1>
        <p className="text-sm text-muted mt-0.5">
          {myTenancy.propertyName}{myTenancy.unitNumber ? ` · Unit ${myTenancy.unitNumber}` : ''}
        </p>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 font-medium">Issue submitted! Your landlord will review it soon.</p>
        </div>
      )}

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Issue Details</GlassCardTitle>
          <GlassCardDescription>Describe the problem so it can be fixed quickly.</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text2">Category</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                      category === cat.value
                        ? cat.color + ' scale-[1.03]'
                        : 'border-border/60 bg-surface2/40 text-muted hover:border-border hover:text-text'
                    }`}
                  >
                    <cat.icon className="h-5 w-5" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <Input
              id="issue-title"
              label="Issue Title"
              placeholder="e.g. Water leaking from bathroom taping"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-desc" className="text-xs font-medium text-text2">
                Description <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="issue-desc"
                rows={4}
                placeholder="Please describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
              />
            </div>

            <Button type="submit" loading={loading} disabled={!title.trim()}>
              <AlertTriangle className="h-4 w-4" />
              Submit Report
            </Button>
          </form>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
