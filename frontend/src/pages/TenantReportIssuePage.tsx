import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Wrench,
  Droplets,
  Zap,
  Wifi,
  Paintbrush,
  ShieldAlert,
  Sparkles,
  Upload,
  Clock,
  ArrowRight,
  Inbox,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/stores/authStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useToast } from '@/hooks/useToast'

type IssueCategory = 'Electrical' | 'Water' | 'Plumbing' | 'Cleaning' | 'Security' | 'Internet' | 'Painting' | 'Furniture' | 'Other'
type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Emergency'

const CATEGORIES: { value: IssueCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'Electrical', label: 'Electrical', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'Water', label: 'Water', icon: Droplets, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { value: 'Plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'Cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'Security', label: 'Security', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { value: 'Internet', label: 'Internet', icon: Wifi, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'Painting', label: 'Painting', icon: Paintbrush, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  { value: 'Furniture', label: 'Furniture', icon: Wrench, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { value: 'Other', label: 'Other', icon: Wrench, color: 'text-muted bg-surface2/60 border-border' },
]

async function compressImageToCanvas(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width
      let h = img.height
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }
    img.src = url
  })
}

export function TenantReportIssuePage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const toast = useToast()

  const { items: tenancies } = useTenanciesStore()
  const { items: maintenanceItems, add: addMaintenance } = useMaintenanceStore()
  const { addNotification } = useNotificationsStore()

  const userEmail = user?.email ?? ''
  const myTenancy = tenancies.find(
    (t) => (t.id === user?.tenancyId || t.tenantEmail.toLowerCase() === userEmail.toLowerCase()) && t.status === 'active'
  )

  const [category, setCategory] = useState<IssueCategory>('Electrical')
  const [priority, setPriority] = useState<PriorityLevel>('Medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filter issues reported by this tenant
  const myReportedIssues = maintenanceItems.filter(
    (item) =>
      (item.tenantEmail && item.tenantEmail.toLowerCase() === userEmail.toLowerCase()) ||
      (item.reportedBy && item.reportedBy.toLowerCase() === (user?.name ?? '').toLowerCase()),
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', { description: 'Please select a valid image file (JPG, PNG, WebP).' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', { description: 'Image must be less than 10MB.' })
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setUploadedImageUrl(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter an issue title and description.')
      return
    }

    setSubmitting(true)
    let finalImageUrl: string | null = uploadedImageUrl

    // 1. Upload photo to ImageKit if selected
    if (selectedFile && !finalImageUrl) {
      try {
        setUploadingImage(true)
        const base64Data = await compressImageToCanvas(selectedFile, 1280, 0.85)

        const uploadRes = await apiClient.post<{ data: { url: string } }>(
          '/properties/upload-image',
          {
            file: base64Data,
            fileName: selectedFile.name || `maintenance_${Date.now()}.jpg`,
          },
          { timeout: 60_000 }
        )

        if (uploadRes.data?.data?.url) {
          finalImageUrl = uploadRes.data.data.url
          setUploadedImageUrl(finalImageUrl)
        } else {
          throw new Error('ImageKit upload did not return a valid CDN URL')
        }
      } catch (err: any) {
        setSubmitting(false)
        setUploadingImage(false)
        toast.error('Image Upload Failed', {
          description:
            err?.response?.data?.error?.message ||
            err?.message ||
            'Could not upload photo to ImageKit. Please retry or remove photo.',
        })
        return
      } finally {
        setUploadingImage(false)
      }
    }

    try {
      await addMaintenance({
        propertyName: myTenancy ? `${myTenancy.propertyName} (${myTenancy.unitNumber ?? 'Main'})` : 'Rented Property',
        propertyId: myTenancy?.propertyId,
        reportedBy: myTenancy?.tenantName ?? user?.name ?? 'Tenant',
        tenantEmail: userEmail,
        title: `[${category.toUpperCase()}] ${title.trim()}`,
        description: description.trim(),
        priority: priority.toLowerCase() as any,
        status: 'open',
        imageUrl: finalImageUrl,
        issueImageUrl: finalImageUrl,
      })

      // Automatically notify Property Owner if owner email is known
      if (myTenancy?.ownerEmail) {
        addNotification({
          userEmail: myTenancy.ownerEmail,
          title: 'New Maintenance Request 🛠️',
          message: `${user?.name || 'Tenant'} submitted a ${priority} priority ${category} issue for ${myTenancy.propertyName}.`,
          type: 'warning',
        })
      }

      // Confirmation notification to Tenant
      addNotification({
        userEmail: userEmail,
        title: 'Maintenance Request Submitted 🛠️',
        message: `Your issue "${title.trim()}" for ${myTenancy?.propertyName ?? 'property'} has been logged.`,
        type: 'info',
      })

      toast.success('Maintenance Issue Reported! 🛠️', {
        description: 'Your property owner has been notified.',
      })

      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setImagePreview(null)
      setUploadedImageUrl(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit maintenance request')
    } finally {
      setSubmitting(false)
    }
  }

  // If tenant has NO active tenancy
  if (!myTenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
          <AlertTriangle className="h-10 w-10 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-text">No Active Property</h2>
        <p className="text-sm text-muted leading-relaxed">
          You must have an active rented property before submitting maintenance requests.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/app/properties')} className="font-bold shadow-md mt-2">
          Browse Properties <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text flex items-center gap-2">
          Report Maintenance Issue <Wrench className="h-5 w-5 text-amber-400" />
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Submit maintenance requests for <strong>{myTenancy.propertyName}</strong>. Track real-time progress timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Issue Submission Form */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>New Maintenance Request</GlassCardTitle>
            <GlassCardDescription>Specify the category, priority, and description of the issue.</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Issue Category */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Issue Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                        category === cat.value
                          ? cat.color + ' scale-[1.03] shadow-md ring-2 ring-primary/40'
                          : 'border-border/60 bg-surface2/40 text-muted hover:border-border hover:text-text'
                      }`}
                    >
                      <cat.icon className="h-5 w-5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Low', 'Medium', 'High'] as PriorityLevel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        priority === p
                          ? p === 'High'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : p === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-surface2/40 text-muted border-border/40 hover:text-text'
                      }`}
                    >
                      {p} Priority
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <Input
                label="Issue Title"
                placeholder="e.g. Water leak under kitchen sink"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue in detail so the technician can bring proper tools..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="glass-input w-full resize-none min-h-[100px]"
                />
              </div>

              {/* Upload Images */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Upload Photo (Optional)</label>
                {imagePreview ? (
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-border bg-surface2">
                    <img src={imagePreview} alt="Issue preview" className="h-full w-full object-cover" />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold">
                        <Spinner label="Uploading photo to ImageKit..." />
                      </div>
                    )}
                    {!uploadingImage && !submitting && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-surface2/30 p-4 text-center cursor-pointer hover:border-primary/50 transition">
                    <Upload className="h-6 w-6 text-muted" />
                    <span className="text-xs text-muted font-medium">Click to select photo attachment</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={submitting || uploadingImage} />
                  </label>
                )}
              </div>

              <Button type="submit" variant="primary" loading={submitting || uploadingImage} disabled={submitting || uploadingImage} className="font-bold py-3 mt-2 shadow-lg">
                <Wrench className="h-4 w-4" /> Submit Maintenance Request
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>

        {/* Right: Request Timelines & History */}
        <div className="flex flex-col gap-6">
          <GlassCard className="p-0 overflow-hidden">
            <GlassCardHeader className="px-6 pt-5 pb-3">
              <GlassCardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Active Maintenance Timelines
              </GlassCardTitle>
              <GlassCardDescription>Track status progression of reported issues.</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="px-6 pb-6">
              {myReportedIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <Inbox className="h-8 w-8 text-muted/40" />
                  <p className="text-xs text-muted">No maintenance requests reported yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 divide-y divide-border/40">
                  {myReportedIssues.map((issue) => (
                    <div key={issue.id} className="pt-4 first:pt-0 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-text">{issue.title}</h4>
                          <span className="text-[10px] text-muted">{new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Badge
                          intent={
                            issue.status === 'resolved' || issue.status === 'closed'
                              ? 'success'
                              : issue.status === 'in-progress'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                          className="capitalize font-semibold text-[10px]"
                        >
                          {issue.status}
                        </Badge>
                      </div>

                      {/* Display Persisted Photo if present */}
                      {(issue.imageUrl || issue.issueImageUrl) && (
                        <a
                          href={issue.imageUrl || issue.issueImageUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative h-36 w-full rounded-xl overflow-hidden border border-border/60 bg-surface2/40 group"
                          title="Click to view full photo"
                        >
                          <img
                            src={issue.imageUrl || issue.issueImageUrl!}
                            alt={issue.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      )}

                      {/* Request Step Timeline Visual Bar */}
                      <TimelineProgressBar status={issue.status} />
                    </div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ─── Step Progress Bar Component ─────────────────────────────────────────────
function TimelineProgressBar({ status }: { status: string }) {
  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  const getStepIndex = (s: string) => {
    if (s === 'open') return 0
    if (s === 'assigned') return 1
    if (s === 'in-progress') return 2
    if (s === 'resolved' || s === 'closed') return 3
    return 0
  }

  const currentIndex = getStepIndex(status)

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex
          return (
            <div key={step.key} className="flex flex-col items-center gap-1 flex-1 text-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-surface2 text-muted border border-border/40'
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-[10px] font-medium ${isDone ? 'text-text' : 'text-muted'}`}>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
