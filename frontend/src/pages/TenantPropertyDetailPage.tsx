import { useState } from 'react'
import {
  ArrowLeft,
  Key,
  MapPin,
  Phone,
  User,
  Shield,
  CheckCircle,
  Car,
  Layers,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/GlassCard'
import { Modal } from '@/components/ui/Modal'
import { PropertyUnitsCard } from '@/components/property/PropertyUnitsCard'
import { useAuthStore } from '@/stores/authStore'
import { useListingsStore } from '@/stores/listingsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useRentalRequestsStore } from '@/stores/rentalRequestsStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useToast } from '@/hooks/useToast'

import { derivePropertyUnits } from '@/lib/unitUtils'

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
]

export function TenantPropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const toast = useToast()

  const { items: listings } = useListingsStore()
  const { items: properties } = useLocalPropertiesStore()
  const { items: tenancies } = useTenanciesStore()
  const { addRequest } = useRentalRequestsStore()
  const { addNotification } = useNotificationsStore()

  const listing = listings.find((l) => l.id === id)
  const localProperty = properties.find((p) => p.id === id)

  const propertyImages = localProperty?.imageUrl
    ? [localProperty.imageUrl]
    : (localProperty as any)?.images?.length
      ? (localProperty as any).images
      : GALLERY_IMAGES

  // Selected image gallery state
  const [selectedImage, setSelectedImage] = useState(0)

  // Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [mobileNumber, setMobileNumber] = useState('')
  const [city, setCity] = useState(localProperty?.address.city ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>('')

  // Available units calculation
  const unitsList = localProperty
    ? derivePropertyUnits(localProperty, tenancies)
    : []
  const availableUnitsList = unitsList.filter((u) => u.status === 'AVAILABLE')

  // Check if tenant already has an active tenancy for this property
  const existingTenancy = tenancies.find(
    (t) =>
      t.tenantEmail.toLowerCase() === (user?.email ?? '').toLowerCase() &&
      ((listing && t.propertyName === listing.propertyName) || (localProperty && t.propertyId === localProperty.id))
  )

  if (!listing && !localProperty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-12 w-12 text-muted" />
        <h2 className="text-lg font-semibold text-text">Property Not Found</h2>
        <p className="text-sm text-muted">The requested property listing could not be found or has been removed.</p>
        <Button variant="secondary" onClick={() => navigate('/app/properties')}>
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Button>
      </div>
    )
  }

  const propertyName = listing?.propertyName ?? localProperty?.name ?? 'Property'
  const price = listing?.price ?? (localProperty ? (localProperty.listingStatus === 'for-sale' ? localProperty.salePrice : localProperty.monthlyRent) : 0) ?? 0
  const bedrooms = localProperty?.bedrooms ?? listing?.bedrooms
  const bathrooms = localProperty?.bathrooms ?? listing?.bathrooms
  const parking = localProperty?.parking
  const areaSqFt = localProperty?.areaSqFt ?? listing?.areaSqFt
  const description = listing?.description ?? localProperty?.description ?? 'Spacious, well-lit residential unit situated in a prime locality with top amenities.'
  const propertyType = listing?.type ?? 'rent'
  const status = listing?.status ?? 'available'
  const isAvailable = status === 'available'
  const propertyCity = localProperty?.address.city ?? 'Location unavailable'
  const addressLine = localProperty?.address.line1 ?? 'Prime Location, Main Road'

  const handleOpenRequestModal = () => {
    if (!user) {
      toast.info('Please log in to submit a rental application.')
      navigate('/login')
      return
    }

    if (localProperty && (localProperty as any).totalUnits - (localProperty as any).occupiedUnits <= 0) {
      toast.error('This property is currently fully occupied.', {
        description: 'No available units are open for new rental applications.',
      })
      return
    }

    const avail = localProperty
      ? derivePropertyUnits(localProperty, tenancies).filter((u) => u.status === 'AVAILABLE')
      : []

    if (avail.length === 0) {
      toast.error('This property is currently fully occupied.', {
        description: 'No available units are open for new rental applications.',
      })
      return
    }

    setSelectedUnitNumber(avail[0]?.unitNumber ?? 'Main')
    setFullName(user.name)
    setRequestModalOpen(true)
  }

  const handleSubmitRentalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !mobileNumber.trim() || !city.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (availableUnitsList.length === 0) {
      toast.error('No units currently available for rent in this property.')
      return
    }

    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))

    // Create rental request in store
    try {
      await addRequest({
        propertyId: id ?? 'prop_001',
        propertyName,
        propertyType,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        city: city.trim(),
        monthlyRent: price,
        unitNumber: selectedUnitNumber || availableUnitsList[0]?.unitNumber || 'Main',
      })

      toast.success('Rental Request Sent!', {
        description: 'The property owner will review your application and respond soon.',
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rental request')
    }

    setSubmitting(false)
    setRequestModalOpen(false)
  }

  const handleInquirePurchase = async () => {
    const ownerEmail = (localProperty as any)?.ownerEmail
    if (ownerEmail) {
      await addNotification({
        userEmail: ownerEmail.toLowerCase(),
        title: '🏷️ Property Purchase Inquiry',
        message: `${user?.name || 'A prospective buyer'} submitted a purchase inquiry for ${propertyName}.`,
        type: 'info',
        eventType: 'PURCHASE_INQUIRY',
        relatedEntityId: `${id}_${Date.now()}`,
      })
      toast.success('Purchase inquiry sent directly to the property owner!')
    } else {
      toast.info('Purchase inquiry recorded. Property owner notified.')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Button>
        <div className="flex items-center gap-2">
          <Badge intent={propertyType === 'rent' ? 'primary' : 'success'} size="md">
            {propertyType === 'rent' ? 'For Rent' : 'For Sale'}
          </Badge>
          <Badge intent={isAvailable ? 'success' : 'warning'} size="md">
            {isAvailable ? 'Available Now' : 'Under Review'}
          </Badge>
        </div>
      </div>

      {/* Large Image Gallery */}
      <GlassCard className="p-4 overflow-hidden">
        <div className="flex flex-col gap-3">
          {/* Main Large Image */}
          <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-surface2 border border-border/40">
            <img
              src={propertyImages[selectedImage] || propertyImages[0]}
              alt={propertyName}
              className="h-full w-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 text-white">
              <h1 className="text-3xl font-extrabold font-display drop-shadow-md">{propertyName}</h1>
              <p className="text-sm font-medium opacity-90 flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4 text-primary" /> {addressLine}, {propertyCity}
              </p>
            </div>
            <div className="absolute bottom-4 right-6 text-white text-right">
              <p className="text-3xl font-extrabold font-display text-emerald-400">
                {price > 0 ? formatRupee(price) : 'Contact Owner'}
                <span className="text-sm font-normal text-white/80">/month</span>
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-3">
            {propertyImages.map((img: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(idx)}
                className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === idx ? 'border-primary scale-[1.02] shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Description & Specifications */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Key Specs Breakdown */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Property Specifications</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <SpecBox icon={<Key className="h-5 w-5 text-primary" />} label="Bedrooms" value={bedrooms !== undefined && bedrooms !== null ? `${bedrooms} BHK` : 'Not specified'} />
                <SpecBox icon={<span className="text-lg">🛁</span>} label="Bathrooms" value={bathrooms !== undefined && bathrooms !== null ? `${bathrooms} Baths` : 'Not specified'} />
                <SpecBox icon={<Car className="h-5 w-5 text-emerald-400" />} label="Parking" value={parking !== undefined && parking !== null ? `${parking} Spaces` : 'Not specified'} />
                <SpecBox icon={<span className="text-lg">📐</span>} label="Total Area" value={areaSqFt !== undefined && areaSqFt !== null ? `${areaSqFt} sq ft` : 'Not specified'} />
                <SpecBox icon={<MapPin className="h-5 w-5 text-sky-400" />} label="City" value={propertyCity || 'Not specified'} />
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>About This Property</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <p className="text-sm text-text2 leading-relaxed whitespace-pre-line">{description}</p>
            </GlassCardContent>
          </GlassCard>

          {/* Amenities */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Amenities & Facilities</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {['24/7 Power Backup', 'High Speed Wifi', 'Elevator / Lift', 'Gym & Fitness', 'Covered Parking', 'Gated Community', 'Swimming Pool', 'CCTV Surveillance', 'Water Supply 24h'].map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 rounded-xl border border-border/40 bg-surface2/40 px-3 py-2 text-xs font-medium text-text">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Real Property Units Management Card */}
          {localProperty && <PropertyUnitsCard property={localProperty} tenancies={tenancies} />}
        </div>

        {/* Right Column: Owner Info & Rental Request CTA */}
        <div className="flex flex-col gap-6">
          {/* Price & Request Card */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex flex-col gap-4 text-center">
              <div>
                <span className="text-xs text-muted uppercase font-semibold">Monthly Rent</span>
                <h3 className="text-3xl font-extrabold text-text font-display mt-0.5">
                  {price > 0 ? formatRupee(price) : 'Contact Owner'}
                </h3>
              </div>

              <div className="divide-y divide-border/40 text-xs py-2">
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Security Deposit</span>
                  <span className="font-semibold text-text">{formatRupee(localProperty?.securityDeposit || price)}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Advance Rent</span>
                  <span className="font-semibold text-text">1 Month</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted">Availability</span>
                  <span className="font-semibold text-emerald-400">Immediate</span>
                </div>
              </div>

              {existingTenancy ? (
                <Badge intent="success" size="md" className="py-2.5 justify-center text-sm font-semibold">
                  This is your current residence
                </Badge>
              ) : propertyType === 'rent' ? (
                <Button variant="primary" size="lg" className="w-full font-bold shadow-lg" onClick={handleOpenRequestModal}>
                  <Sparkles className="h-4 w-4" /> Request For Rent
                </Button>
              ) : (
                <Button variant="primary" size="lg" className="w-full font-bold" onClick={handleInquirePurchase}>
                  Inquire to Purchase
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Owner Information Card */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Owner Information
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {((localProperty as any)?.ownerName || (localProperty as any)?.ownerEmail || 'PO').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-text text-sm">
                    {(localProperty as any)?.ownerName || (localProperty as any)?.ownerEmail || 'Property Owner'}
                  </p>
                  <p className="text-muted text-xs font-mono">
                    {(localProperty as any)?.ownerEmail || 'Verified Owner'}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                {(localProperty as any)?.ownerPhone ? (
                  <Button variant="secondary" size="sm" className="w-full justify-start gap-2" onClick={() => window.location.href = `tel:${(localProperty as any).ownerPhone}`}>
                    <Phone className="h-3.5 w-3.5 text-emerald-400" /> {(localProperty as any).ownerPhone}
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled className="w-full justify-start gap-2 opacity-50 cursor-not-allowed">
                    <Phone className="h-3.5 w-3.5 text-muted" /> Phone not available
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted hover:text-text" onClick={() => toast.info('Contact owner via tenant dashboard.')}>
                  <MessageSquare className="h-3.5 w-3.5 text-primary" /> Contact Owner
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* ─── REQUEST FOR RENT MODAL ─────────────────────────────────────────── */}
      <Modal open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <div className="p-6 flex flex-col gap-4 max-w-md w-full">
          <div>
            <h3 className="text-lg font-bold text-text">Request For Rent</h3>
            <p className="text-xs text-muted mt-0.5">Submit your rental request for <strong>{propertyName}</strong> directly to the owner.</p>
          </div>

          <form onSubmit={handleSubmitRentalRequest} className="flex flex-col gap-4 mt-2">
            {availableUnitsList.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-amber-400" />
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              required
            />

            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Hyderabad"
              required
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={availableUnitsList.length === 0 || !selectedUnitNumber}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </Modal>
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