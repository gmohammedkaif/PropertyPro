import { useState } from 'react'
import { ArrowLeft, Calendar, Key, MapPin, Phone, User, Clock, Shield, Heart } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/authStore'
import { useListingsStore } from '@/stores/listingsStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { useToast } from '@/hooks/useToast'

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function TenantPropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { items: listings } = useListingsStore()
  const { items: properties } = useLocalPropertiesStore()
  const { items: tenancies } = useTenanciesStore()
  const toast = useToast()

  const listing = listings.find(l => l.id === id)
  
  // Also check local properties (for properties not yet listed but available)
  const localProperty = properties.find(p => p.id === id)
  
  // Check if user already has a tenancy for this property
  const existingTenancy = tenancies.find(t => 
    (listing && t.propertyName === listing.propertyName) || 
    (localProperty && t.propertyId === localProperty.id)
  ) && tenancies.find(t => t.tenantEmail === user?.email)

  const [isRequesting, setIsRequesting] = useState(false)

  const handleRequestRent = async () => {
    if (!user) {
      toast.error('Please sign in first')
      navigate('/login')
      return
    }

    setIsRequesting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create a tenancy request (in real app, this would be an API call)
    // For now, we'll show success and navigate to dashboard
    toast.success('Rental Request Submitted!', {
      description: 'The property owner has been notified. You\'ll hear back within 24-48 hours.'
    })
    
    setIsRequesting(false)
    navigate('/app')
  }

  const handleBookViewing = async () => {
    if (!user) {
      toast.error('Please sign in first')
      navigate('/login')
      return
    }

    setIsRequesting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Viewing Booked!', {
      description: 'We\'ll confirm the viewing time via email shortly.'
    })
    
    setIsRequesting(false)
  }

  // If neither listing nor local property found, show not found
  if (!listing && !localProperty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Shield className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text">Property Not Found</h2>
          <p className="mt-1 text-sm text-muted">This property may have been removed or the link may be incorrect.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/app/properties')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Properties
        </Button>
      </div>
    )
  }

  // Use listing data if available, otherwise fall back to local property
  const propertyName = listing?.propertyName ?? localProperty?.name ?? 'Unknown Property'
  const price = listing?.price ?? 0
  const bedrooms = listing?.bedrooms
  const bathrooms = listing?.bathrooms
  const areaSqFt = listing?.areaSqFt
  const description = listing?.description ?? localProperty?.description ?? 'No description available.'
  const propertyType = listing?.type ?? 'rent'
  const status = listing?.status ?? 'available'
  const city = localProperty?.address.city ?? 'Unknown City'
  const address = localProperty?.address.line1 ?? 'Address not available'

  const isAvailable = status === 'available'

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>

      {/* Hero Image Area */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="relative h-72 w-full bg-surface2">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted/50">
              <div className="text-6xl mb-2">🏠</div>
              <p className="text-lg font-medium">{propertyName}</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Status badges */}
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <Badge intent={isAvailable ? 'success' : 'warning'} size="md">
              {isAvailable ? 'Available for Rent' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          
          <div className="absolute right-5 top-5">
            <Badge intent="neutral" size="md">
              {propertyType === 'rent' ? 'For Rent' : 'For Sale'}
            </Badge>
          </div>

          {/* Price overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-3xl font-bold font-display">
              {price > 0 ? formatRupee(price) : 'Contact for Price'} 
              <span className="text-lg font-normal opacity-80">/month</span>
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Property Info */}
          <GlassCard>
            <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
              <div className="flex items-start justify-between">
                <div>
                  <GlassCardTitle className="text-2xl">{propertyName}</GlassCardTitle>
                  <GlassCardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    <span>{address}, {city}</span>
                  </GlassCardDescription>
                </div>
                {existingTenancy && (
                  <Badge intent="success" size="md" className="mt-1">
                    Your Current Home
                  </Badge>
                )}
              </div>
            </GlassCardHeader>
            <GlassCardContent className="px-5 pb-5">
              <p className="text-text2 leading-relaxed">{description}</p>
              
              {/* Features */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {bedrooms && (
                  <div className="flex items-center gap-2 text-sm text-text2">
                    <Key className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{bedrooms} Bedroom{bedrooms > 1 ? 's' : ''}</span>
                  </div>
                )}
                {bathrooms && (
                  <div className="flex items-center gap-2 text-sm text-text2">
                    <span className="text-lg">🛁</span>
                    <span>{bathrooms} Bathroom{bathrooms > 1 ? 's' : ''}</span>
                  </div>
                )}
                {areaSqFt && (
                  <div className="flex items-center gap-2 text-sm text-text2">
                    <span className="text-lg">📐</span>
                    <span>{areaSqFt.toLocaleString()} sq ft</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-text2">
                  <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Available Immediately</span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Amenities / Highlights */}
          <GlassCard>
            <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
              <GlassCardTitle>Property Highlights</GlassCardTitle>
              <GlassCardDescription>Key features and amenities</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <HighlightItem icon={<Shield className="h-5 w-5" />} label="24/7 Security" />
                <HighlightItem icon={<Heart className="h-5 w-5" />} label="Parking Available" />
                <HighlightItem icon={<User className="h-5 w-5" />} label="Near Metro/Bus" />
                <HighlightItem icon={<Clock className="h-5 w-5" />} label="Power Backup" />
                <HighlightItem icon={<Shield className="h-5 w-5" />} label="Gated Community" />
                <HighlightItem icon={<Heart className="h-5 w-5" />} label="Water Supply 24h" />
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar - Actions & Contact */}
        <div className="flex flex-col gap-6">
          {/* Action Card */}
          <GlassCard variant="primary">
            <GlassCardContent className="p-5 flex flex-col gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold font-display text-text">
                  {price > 0 ? formatRupee(price) : 'Contact for Price'}
                </p>
                <p className="text-sm text-muted">Monthly Rent</p>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Security Deposit</span>
                  <span className="font-semibold text-text">{price > 0 ? formatRupee(price * 2) : '2 Months Rent'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Maintenance</span>
                  <span className="font-semibold text-text">As per society</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Lease Term</span>
                  <span className="font-semibold text-text">12 Months</span>
                </div>
              </div>

              {!existingTenancy && isAvailable ? (
                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full"
                    onClick={handleRequestRent}
                    disabled={isRequesting}
                    loading={isRequesting}
                  >
                    Request to Rent
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="w-full"
                    onClick={handleBookViewing}
                    disabled={isRequesting}
                  >
                    Schedule a Viewing
                  </Button>
                </div>
              ) : existingTenancy ? (
                <div className="pt-2">
                  <Badge intent="success" className="w-full justify-center py-3 text-base">
                    This is your current residence
                  </Badge>
                </div>
              ) : (
                <div className="pt-2">
                  <Badge intent="warning" className="w-full justify-center py-3 text-base">
                    Not Currently Available
                  </Badge>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Contact Owner Card */}
          <GlassCard>
            <GlassCardHeader className="px-5 pt-5 pb-3 mb-0">
              <GlassCardTitle>Contact Property Manager</GlassCardTitle>
              <GlassCardDescription>Have questions? Reach out directly.</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="px-5 pb-5 space-y-3">
              <Button variant="secondary" className="w-full justify-start gap-3" onClick={() => {}}>
                <Phone className="h-5 w-5" aria-hidden="true" />
                <span>Call: +91 98765 43210</span>
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3" onClick={() => {}}>
                <User className="h-5 w-5" aria-hidden="true" />
                <span>Message Owner</span>
              </Button>
            </GlassCardContent>
          </GlassCard>

          {/* Save/Share */}
          <GlassCard>
            <GlassCardContent className="p-5 flex flex-col gap-3">
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => {}}>
                <Heart className="h-5 w-5" aria-hidden="true" />
                <span>Save Property</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => {}}>
                <span className="flex h-5 w-5 items-center justify-center">📤</span>
                <span>Share Property</span>
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function HighlightItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-surface/50 p-3 transition hover:border-primary/30 hover:bg-primary/5">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium text-text">{label}</span>
    </div>
  )
}