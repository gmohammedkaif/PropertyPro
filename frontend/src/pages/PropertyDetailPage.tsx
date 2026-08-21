import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  CheckCircle,
  Edit,
  Home,
  Key,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PropertyUnitsCard } from '@/components/property/PropertyUnitsCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { PropertyFormModal } from '@/components/property/PropertyFormModal'
import { DeletePropertyDialog } from '@/components/property/DeletePropertyDialog'
import { useProperty, usePropertyOwner } from '@/hooks/useProperty'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useRentalRequestsStore } from '@/stores/rentalRequestsStore'
import { derivePropertyUnits } from '@/lib/unitUtils'
import { cn } from '@/lib/utils'
import type { PropertyRecord, PropertyStatus, PropertyType } from '@/shared'

// ─── Labels & maps ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  resort: 'Resort',
}

const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; intent: 'success' | 'neutral' }
> = {
  active: { label: 'Active', intent: 'success' },
  archived: { label: 'Archived', intent: 'neutral' },
}

function formatDate(date?: string): string {
  if (!date) return 'Not specified'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

// ─── Zod Schema for Rental Request Validation ────────────────────────────────

const rentalRequestSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  mobileNumber: z.string().trim().min(10, 'Enter a valid mobile number (min 10 digits)'),
  city: z.string().trim().min(1, 'City is required'),
})

type RequestFormData = z.infer<typeof rentalRequestSchema>
type RequestFormErrors = Partial<Record<keyof RequestFormData, string>>

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text">Property Not Found</h2>
        <p className="mt-1 text-sm text-muted">
          This property may have been removed or the link may be incorrect.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/app/properties')}>
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Button>
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PropertyDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((state) => state.user)

  // API Query Hooks
  const { data: apiProperty, isLoading: queryLoading, error: queryError, refetch } = useProperty(id, !!id)
  const { data: ownerInfo } = usePropertyOwner(id, !!id)

  // Stores
  const { items: localProps } = useLocalPropertiesStore()
  const { items: tenancies } = useTenanciesStore()
  const { items: rentalRequests, addRequest } = useRentalRequestsStore()

  // Local property fallback if query is pending or empty
  const localProp = localProps.find((p) => p.id === id)
  const property: PropertyRecord | null = apiProperty || (localProp ? (localProp as unknown as PropertyRecord) : null)

  // Modals state
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Rental Request Modal & Inline Validation State
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>('')
  const [requestForm, setRequestForm] = useState<RequestFormData>({
    fullName: user?.name ?? '',
    mobileNumber: '',
    city: property?.address?.city ?? '',
  })
  const [requestErrors, setRequestErrors] = useState<RequestFormErrors>({})
  const [requestTouched, setRequestTouched] = useState(false)
  const [requestSubmitting, setRequestSubmitting] = useState(false)

  // Loading state
  if (queryLoading && !property) return <PageSkeleton />
  if ((queryError && !property) || !property) return <ErrorState onRetry={() => void refetch()} />

  // Permissions logic
  const isSuperAdmin = user?.roles.includes('admin') || user?.email === 'admin@propertypro.com'
  const isOwner = user?.id === property.ownerId || (user?.email && property.ownerEmail && user.email.toLowerCase() === property.ownerEmail.toLowerCase())
  const isOwnerOrAdmin = isSuperAdmin || isOwner
  const isTenant = user?.roles.includes('tenant') && !isOwnerOrAdmin

  // Images
  const propertyImages = (property.images && property.images.length > 0)
    ? property.images
    : (property.imageUrl ? [property.imageUrl] : [])

  // Tenancy & Request Status for Tenant
  const existingTenancy = tenancies.find(
    (t) =>
      t.tenantEmail.toLowerCase() === (user?.email ?? '').toLowerCase() &&
      (t.propertyId === property.id || t.propertyName?.toLowerCase() === property.name?.toLowerCase()) &&
      t.status === 'active'
  )

  const existingRequest = rentalRequests.find(
    (r) =>
      (r.propertyId === property.id || r.propertyName?.toLowerCase() === property.name?.toLowerCase()) &&
      (r.tenantEmail?.toLowerCase() === (user?.email ?? '').toLowerCase() || r.tenantId === user?.id)
  )

  // Financial calculation
  const isSale = (property as any).listingStatus === 'for-sale'
  const displayPrice = isSale
    ? (property.salePrice && property.salePrice > 0 ? property.salePrice : 0)
    : (property.monthlyRent && property.monthlyRent > 0 ? property.monthlyRent : 0)

  // Available units calculation for Request For Rent modal
  const unitsList = derivePropertyUnits(property, tenancies)
  const availableUnitsList = unitsList.filter((u) => u.status === 'AVAILABLE')

  // Handle Rental Request Modal Open
  const handleOpenRequestModal = () => {
    if (!user) {
      toast.error('Please login first')
      navigate('/login')
      return
    }
    const avail = derivePropertyUnits(property, tenancies).filter((u) => u.status === 'AVAILABLE')

    setSelectedUnitNumber(avail[0]?.unitNumber ?? 'Main')
    setRequestForm({
      fullName: user.name ?? '',
      mobileNumber: '',
      city: property.address?.city ?? '',
    })
    setRequestErrors({})
    setRequestTouched(false)
    setRequestModalOpen(true)
  }

  // Handle Rental Request Form Submission with Inline Zod Validation
  const handleSubmitRentalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (availableUnitsList.length === 0) {
      toast.error('No units available for rent in this property')
      return
    }
    setRequestTouched(true)

    const validationResult = rentalRequestSchema.safeParse(requestForm)
    if (!validationResult.success) {
      const errs: RequestFormErrors = {}
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errs[issue.path[0] as keyof RequestFormData] = issue.message
        }
      })
      setRequestErrors(errs)
      return
    }

    setRequestSubmitting(true)
    try {
      await addRequest({
        propertyId: property.id,
        propertyName: property.name,
        propertyType: property.type,
        fullName: requestForm.fullName.trim(),
        mobileNumber: requestForm.mobileNumber.trim(),
        city: requestForm.city.trim(),
        monthlyRent: displayPrice,
        unitNumber: selectedUnitNumber || availableUnitsList[0]?.unitNumber || 'Main',
      })

      toast.success('Rental Request Sent!', {
        description: `Your rental application for "${property.name}" has been submitted to the owner.`,
      })
      setRequestModalOpen(false)
    } catch (err: any) {
      toast.error('Submission Failed', {
        description: err.message || 'Failed to submit rental request',
      })
    } finally {
      setRequestSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof RequestFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const nextForm = { ...requestForm, [field]: val }
    setRequestForm(nextForm)
    if (requestTouched) {
      const res = rentalRequestSchema.safeParse(nextForm)
      if (!res.success) {
        const errs: RequestFormErrors = {}
        res.error.issues.forEach((issue) => {
          if (issue.path[0]) errs[issue.path[0] as keyof RequestFormData] = issue.message
        })
        setRequestErrors(errs)
      } else {
        setRequestErrors({})
      }
    }
  }

  const statusCfg = (property.status && STATUS_CONFIG[property.status])
    ? STATUS_CONFIG[property.status]
    : { label: property.status ? String(property.status).charAt(0).toUpperCase() + String(property.status).slice(1) : 'Active', intent: 'success' as const }
  const typeLabel = (property.type && TYPE_LABELS[property.type])
    ? TYPE_LABELS[property.type]
    : (property.type ? String(property.type).charAt(0).toUpperCase() + String(property.type).slice(1) : 'Apartment')

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* ─── Top Bar Navigation & Actions ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(user ? '/app/properties' : '/browse')} className="w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Button>

        <div className="flex items-center gap-3">
          <Badge intent={statusCfg.intent} size="md">
            {statusCfg.label}
          </Badge>
          <Badge intent="neutral" size="md">
            {typeLabel}
          </Badge>
          <Badge intent={isSale ? 'success' : 'primary'} size="md">
            {isSale ? 'For Sale' : 'For Rent'}
          </Badge>

          {/* Edit/Delete — Restricted to Owner or Admin */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Hero Image Gallery ───────────────────────────────────────────── */}
      {propertyImages.length > 0 ? (
        <GlassCard className="p-4 overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-surface2 border border-border/40">
              <img
                src={propertyImages[selectedImage] || propertyImages[0]}
                alt={property.name}
                className="h-full w-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 text-white">
                <h1 className="text-3xl font-bold font-display drop-shadow-md">{property.name}</h1>
                <p className="text-sm font-medium opacity-90 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4 text-primary" /> {property.address.line1}, {property.address.city},{' '}
                  {property.address.state} {property.address.postalCode}
                </p>
              </div>
              <div className="absolute bottom-4 right-6 text-white text-right">
                <p className="text-3xl font-bold font-display text-emerald-400">
                  {displayPrice > 0 ? formatRupee(displayPrice) : 'Contact Owner'}
                  {!isSale && displayPrice > 0 && <span className="text-sm font-normal text-white/80">/month</span>}
                </p>
              </div>
            </div>

            {/* Thumbnails */}
            {propertyImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {propertyImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-primary scale-[1.02] shadow-lg'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2 p-8 text-center bg-surface2/30 rounded-2xl border border-border/40">
          <Building2 className="h-12 w-12 text-muted mx-auto" />
          <h1 className="text-2xl font-bold text-text font-display">{property.name}</h1>
          <p className="text-sm text-muted">
            {property.address.line1}, {property.address.city}, {property.address.state}
          </p>
        </div>
      )}

      {/* ─── Main Details Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column — Specs, Description, Amenities, Address */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Key Specifications */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Property Specifications</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {(() => {
                const uList = property.units ?? []
                const hasU = uList.length > 0

                const bhkSet = Array.from(new Set(uList.map((u) => u.bedrooms).filter((b) => b !== undefined)))
                const bhkLabel = hasU
                  ? bhkSet.length === 1 ? `${bhkSet[0]} BHK` : 'Varies by unit'
                  : property.bedrooms ? `${property.bedrooms} BHK` : 'Not specified'

                const bathSet = Array.from(new Set(uList.map((u) => u.bathrooms).filter((b) => b !== undefined)))
                const bathLabel = hasU
                  ? bathSet.length === 1 ? `${bathSet[0]} Baths` : 'Varies by unit'
                  : property.bathrooms ? `${property.bathrooms} Baths` : 'Not specified'

                const parkSet = Array.from(new Set(uList.map((u) => u.parking).filter((p) => p !== undefined)))
                const parkLabel = hasU
                  ? parkSet.length === 1 ? `${parkSet[0]} Spaces` : 'Varies by unit'
                  : property.parking !== undefined ? `${property.parking} Spaces` : 'Not specified'

                const areaSet = Array.from(new Set(uList.map((u) => u.areaSqFt).filter((a) => a !== undefined)))
                const areaLabel = hasU
                  ? areaSet.length === 1 ? `${areaSet[0]} sq ft` : 'Varies by unit'
                  : property.areaSqFt ? `${property.areaSqFt} sq ft` : 'Not specified'

                return (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <SpecBox
                      icon={<Key className="h-5 w-5 text-primary" />}
                      label="Bedrooms"
                      value={bhkLabel}
                    />
                    <SpecBox
                      icon={<span className="text-lg">🛁</span>}
                      label="Bathrooms"
                      value={bathLabel}
                    />
                    <SpecBox
                      icon={<Car className="h-5 w-5 text-emerald-400" />}
                      label="Parking"
                      value={parkLabel}
                    />
                    <SpecBox
                      icon={<span className="text-lg">📐</span>}
                      label="Total Area"
                      value={areaLabel}
                    />
                    <SpecBox
                      icon={<MapPin className="h-5 w-5 text-sky-400" />}
                      label="City"
                      value={property.address?.city || 'Not specified'}
                    />
                  </div>
                )
              })()}
            </GlassCardContent>
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>About This Property</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-sm text-text2 leading-relaxed whitespace-pre-line">
                {property.description ? property.description : 'No description provided.'}
              </p>
            </GlassCardContent>
          </GlassCard>

          {/* Amenities & Facilities — Real persisted amenities */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Amenities & Facilities</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 rounded-xl border border-border/40 bg-surface2/40 px-3 py-2 text-xs font-medium text-text"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No amenities recorded.</p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Real Property Units Management Card */}
          <PropertyUnitsCard property={property} tenancies={tenancies} />

          {/* Full Address Card */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Address Details</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="text-sm text-text leading-relaxed">
                  <p>{property.address.line1}</p>
                  {property.address.line2 && <p>{property.address.line2}</p>}
                  <p>
                    {property.address.city}, {property.address.state} {property.address.postalCode}
                  </p>
                  <p className="text-xs text-muted mt-1">{property.address.country}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Right Column — Pricing, CTA & Owner Info */}
        <div className="flex flex-col gap-6">
          {/* Price & Action Card */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex flex-col gap-4 text-center">
              <div>
                <span className="text-xs text-muted uppercase font-semibold">
                  {isSale ? 'Sale Price' : 'Monthly Rent'}
                </span>
                <h3 className="text-3xl font-bold text-text font-display mt-0.5">
                  {displayPrice > 0 ? formatRupee(displayPrice) : 'Contact Owner'}
                </h3>
              </div>

              <div className="divide-y divide-border/40 text-xs py-2">
                {!isSale && (
                  <div className="py-2 flex justify-between">
                    <span className="text-muted">Security Deposit</span>
                    <span className="font-semibold text-text">
                      {property.securityDeposit && property.securityDeposit > 0
                        ? formatRupee(property.securityDeposit)
                        : 'Not specified'}
                    </span>
                  </div>
                )}
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Total Units</span>
                  <span className="font-semibold text-text">{property.totalUnits || 1}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Listed On</span>
                  <span className="font-semibold text-text">{formatDate(property.createdAt)}</span>
                </div>
              </div>

              {/* Status-aware Rental Request / Owner Action CTA */}
              {isOwnerOrAdmin ? (
                <div className="flex flex-col gap-2">
                  <Badge intent="neutral" size="md" className="py-2.5 justify-center text-sm font-semibold">
                    {isOwner ? 'You own this property' : 'Property Management'}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full font-bold"
                    onClick={() => setEditOpen(true)}
                  >
                    <Edit className="h-4 w-4" /> Edit Property Details
                  </Button>
                </div>
              ) : existingTenancy ? (
                <Badge intent="success" size="md" className="py-2.5 justify-center text-sm font-semibold">
                  This is your current residence
                </Badge>
              ) : existingRequest ? (
                <div className="flex flex-col gap-2">
                  <Badge
                    intent={
                      existingRequest.status === 'approved'
                        ? 'success'
                        : existingRequest.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="md"
                    className="py-2.5 justify-center text-sm font-semibold uppercase"
                  >
                    Request {existingRequest.status}
                  </Badge>
                  {existingRequest.status === 'rejected' && (
                    <Button variant="secondary" size="md" onClick={handleOpenRequestModal} className="w-full mt-1">
                      Resubmit Request
                    </Button>
                  )}
                </div>
              ) : !isSale ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-lg"
                  onClick={handleOpenRequestModal}
                >
                  <Sparkles className="h-4 w-4" /> Request For Rent
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold"
                  onClick={() => toast.info('Owner contacted for purchasing inquiry.')}
                >
                  Inquire to Purchase
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Owner Information Card — Real Owner Source */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Owner Information
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {(ownerInfo?.name || property.ownerEmail || 'OW').slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="font-bold text-text text-sm truncate">
                    {ownerInfo?.name && ownerInfo.name !== 'Owner information unavailable'
                      ? ownerInfo.name
                      : property.ownerEmail || 'Property Owner'}
                  </p>
                  <p className="text-muted truncate">{ownerInfo?.email || property.ownerEmail || 'Verified Owner'}</p>
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg bg-surface2/40 px-3 py-2 border border-border/40">
                  <span className="text-muted">Contact Phone:</span>
                  <span className="font-semibold text-text">
                    {ownerInfo?.phone ? ownerInfo.phone : 'Not available'}
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* ─── RENTAL REQUEST MODAL WITH INLINE ZOD VALIDATION ───────────────── */}
      <Modal open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <div className="p-6 flex flex-col gap-4 max-w-md w-full">
          <div>
            <h3 className="text-lg font-bold text-text">Request For Rent</h3>
            <p className="text-xs text-muted mt-0.5">
              Submit your rental request for <strong>{property.name}</strong> directly to the owner.
            </p>
          </div>

          <form onSubmit={handleSubmitRentalRequest} noValidate className="flex flex-col gap-4 mt-2">
            {availableUnitsList.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>No units currently available for rent in this property.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text/80 tracking-wide">
                  Select Unit / Floor <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedUnitNumber}
                  onChange={(e) => setSelectedUnitNumber(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
                >
                  {availableUnitsList.map((u) => (
                    <option key={u.unitNumber} value={u.unitNumber}>
                      {u.unitNumber} ({u.floor}) — Available
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Full Name"
              value={requestForm.fullName}
              onChange={handleInputChange('fullName')}
              placeholder="Your Full Name"
              error={requestErrors.fullName}
            />

            <Input
              label="Mobile Number"
              type="tel"
              value={requestForm.mobileNumber}
              onChange={handleInputChange('mobileNumber')}
              placeholder="e.g. 9876543210"
              error={requestErrors.mobileNumber}
            />

            <Input
              label="City"
              value={requestForm.city}
              onChange={handleInputChange('city')}
              placeholder="e.g. Hyderabad"
              error={requestErrors.city}
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={requestSubmitting}
                disabled={availableUnitsList.length === 0 || !selectedUnitNumber}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ─── EDIT & DELETE MODALS FOR OWNER/ADMIN ──────────────────────────── */}
      {isOwnerOrAdmin && (
        <>
          <PropertyFormModal open={editOpen} onOpenChange={setEditOpen} property={property} />
          <DeletePropertyDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            property={property}
            onDeleted={() => navigate('/app/properties')}
          />
        </>
      )}
    </div>
  )
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/40 bg-surface2/30 p-3">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <span className="text-sm font-bold text-text">{value}</span>
    </div>
  )
}
