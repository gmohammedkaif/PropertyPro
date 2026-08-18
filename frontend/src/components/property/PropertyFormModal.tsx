import { useEffect, useState, useRef } from 'react'
import { Upload, Image, X, Building2, DollarSign, MapPin, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperty'
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore, type LocalPropertyType } from '@/stores/localPropertiesStore'
import { useAdminOwners } from '@/hooks/useAdmin'
import type { PropertyRecord } from '@/shared'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  type: string
  description: string
  totalUnits: string
  bedrooms: string
  bathrooms: string
  parking: string
  areaSqFt: string
  monthlyRent: string
  securityDeposit: string
  salePrice: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  images: File[]
  imagePreviews: string[]
  ownerId?: string
}

interface FormErrors {
  name?: string
  type?: string
  line1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  image?: string
  ownerId?: string
  securityDeposit?: string
}

interface Suggestion {
  label: string
  city: string
  state: string
  postalCode: string
  country: string
  countryCode: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
  })
}

// ─── Mode ─────────────────────────────────────────────────────────────────────

type Mode = 'create' | 'edit'

export interface PropertyFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the modal renders in edit mode. */
  property?: PropertyRecord
  onSuccess?: (property: PropertyRecord) => void
}

// ─── Options ──────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
]

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IN', label: 'India' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'UAE' },
]

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: FormData, mode: Mode, isSuperAdmin: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = 'Property name is required'
  if (!data.type) errors.type = 'Property type is required'
  if (!data.line1.trim()) errors.line1 = 'Address is required'
  if (!data.city.trim()) errors.city = 'City is required'
  if (!data.state.trim()) errors.state = 'State / province is required'
  if (!data.postalCode.trim()) errors.postalCode = 'Postal code is required'
  if (!data.country) errors.country = 'Country is required'
  if (mode === 'create' && data.images.length === 0 && data.imagePreviews.length === 0) {
    errors.image = 'Please upload at least one property image.'
  }
  if (isSuperAdmin && mode === 'create' && !data.ownerId) {
    errors.ownerId = 'Please select a property owner.'
  }
  if (data.securityDeposit && parseFloat(data.securityDeposit) < 0) {
    errors.securityDeposit = 'Security deposit must be non-negative'
  }
  return errors
}

function hasErrors(errors: FormErrors) {
  return Object.keys(errors).length > 0
}

// ─── Default form state ───────────────────────────────────────────────────────

function defaultForm(property?: PropertyRecord): FormData {
  if (property) {
    return {
      name: property.name,
      type: property.type,
      description: property.description ?? '',
      totalUnits: String(property.totalUnits ?? ''),
      bedrooms: String((property as any).bedrooms ?? ''),
      bathrooms: String((property as any).bathrooms ?? ''),
      parking: String((property as any).parking ?? ''),
      areaSqFt: String((property as any).areaSqFt ?? ''),
      monthlyRent: String((property as any).monthlyRent ?? ''),
      securityDeposit: String((property as any).securityDeposit ?? ''),
      salePrice: String((property as any).salePrice ?? ''),
      line1: property.address.line1,
      line2: property.address.line2 ?? '',
      city: property.address.city,
      state: property.address.state,
      postalCode: property.address.postalCode,
      country: property.address.country,
      images: [],
      imagePreviews: property.imageUrl ? [property.imageUrl] : (property.images ?? []),
      ownerId: property.ownerId,
    }
  }
  return {
    name: '',
    type: '',
    description: '',
    totalUnits: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    areaSqFt: '',
    monthlyRent: '',
    securityDeposit: '',
    salePrice: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    images: [],
    imagePreviews: [],
    ownerId: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyFormModal({
  open,
  onOpenChange,
  property,
}: PropertyFormModalProps) {
  const mode: Mode = property ? 'edit' : 'create'
  const toast = useToast()
  const user = useAuthStore((state) => state.user)

  const isSuperAdmin = user?.roles.includes('admin') || user?.email === 'admin@propertypro.com'
  const { data: owners = [] } = useAdminOwners({ enabled: isSuperAdmin })

  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const [isUploading, setIsUploading] = useState(false)
  const isPending = createProperty.isPending || updateProperty.isPending || isUploading

  const [form, setForm] = useState<FormData>(() => defaultForm(property))
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)

  // Autocomplete search states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [shouldSearch, setShouldSearch] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Debounced API call to fetch suggestions
  useEffect(() => {
    if (!shouldSearch || !form.city || form.city.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await apiClient.get<ApiEnvelope<Suggestion[]>>('/properties/autocomplete', {
          params: { q: form.city.trim() },
        })
        if (data.data) {
          setSuggestions(data.data)
          setShowSuggestions(data.data.length > 0)
          setSelectedIndex(-1)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (err) {
        console.error('Autocomplete search failed:', err)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(delayDebounceFn)
  }, [form.city, shouldSearch])

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, city: value }))
    setShouldSearch(true)
    if (touched) {
      setErrors(validate({ ...form, city: value }, mode, isSuperAdmin))
    }
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setForm((prev) => {
      const matchedCountry = COUNTRY_OPTIONS.find(
        (opt) =>
          opt.value.toUpperCase() === suggestion.countryCode.toUpperCase() ||
          opt.label.toLowerCase() === suggestion.country.toLowerCase()
      )
      return {
        ...prev,
        city: suggestion.city,
        state: suggestion.state || prev.state,
        postalCode: suggestion.postalCode || prev.postalCode,
        country: matchedCountry ? matchedCountry.value : (suggestion.countryCode || prev.country),
      }
    })
    setShouldSearch(false)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        break
    }
  }

  // Image upload handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024) // 5MB max
    
    if (validFiles.length !== files.length) {
      toast.warning('Some files were skipped', { description: 'Only image files under 5MB are allowed.' })
    }

    const newPreviews = validFiles.map(f => URL.createObjectURL(f))
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }))
    setErrors(prev => ({ ...prev, image: undefined }))
  }

  const removeImage = (index: number) => {
    setForm(prev => {
      // Revoke object URL to prevent memory leaks
      if (prev.imagePreviews[index]?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.imagePreviews[index])
      }
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
      }
    })
  }

  // Reset form when the modal opens / property changes
  useEffect(() => {
    if (open) {
      setForm(defaultForm(property))
      setErrors({})
      setTouched(false)
    }
    // Cleanup previews on unmount
    return () => {
      form.imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
      })
    }
  }, [open, property])

  const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (touched) {
      setErrors(validate({ ...form, [field]: value }, mode, isSuperAdmin))
    }
  }

  const { add: addLocal, update: updateLocal } = useLocalPropertiesStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    setTouched(true)
    const validationErrors = validate(form, mode, isSuperAdmin)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      if (validationErrors.image) {
        toast.error('Image Required', { description: validationErrors.image })
      }
      return
    }

    if (!user) {
      toast.error('You must be logged in to add a property.')
      return
    }

    // Handle ImageKit upload first before creating Property record
    let uploadedImageUrl = form.imagePreviews.find((url) => url.startsWith('https://ik.imagekit.io/'))

    if (!uploadedImageUrl && form.images.length > 0) {
      setIsUploading(true)
      try {
        const base64Data = await fileToBase64(form.images[0])
        const { apiClient } = await import('@/lib/apiClient')
        const uploadRes = await apiClient.post<{ data: { url: string } }>('/properties/upload-image', {
          file: base64Data,
          fileName: form.images[0].name,
        })

        if (uploadRes.data?.data?.url) {
          uploadedImageUrl = uploadRes.data.data.url
        } else {
          throw new Error('ImageKit response did not include a valid URL.')
        }
      } catch (uploadErr: any) {
        setIsUploading(false)
        const errMsg = uploadErr?.response?.data?.error?.message || uploadErr?.message || 'Failed to upload property image to ImageKit.'
        toast.error('ImageKit Upload Failed', { description: errMsg })
        return
      } finally {
        setIsUploading(false)
      }
    }

    if (mode === 'create' && !uploadedImageUrl) {
      setErrors((prev) => ({ ...prev, image: 'Please upload at least one property image.' }))
      toast.error('Image Required', { description: 'Please upload at least one property image.' })
      return
    }

    const totalUnits = form.totalUnits ? parseInt(form.totalUnits, 10) : 0
    const bedrooms = form.bedrooms ? parseInt(form.bedrooms, 10) : undefined
    const bathrooms = form.bathrooms ? parseInt(form.bathrooms, 10) : undefined
    const parking = form.parking ? parseInt(form.parking, 10) : undefined
    const areaSqFt = form.areaSqFt ? parseFloat(form.areaSqFt) : undefined
    const monthlyRent = form.monthlyRent ? parseFloat(form.monthlyRent) : undefined
    const securityDeposit = form.securityDeposit ? parseFloat(form.securityDeposit) : undefined
    const salePrice = form.salePrice ? parseFloat(form.salePrice) : undefined

    const addressPayload = {
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
    }

    try {
      if (mode === 'create') {
        const selectedOwner = owners.find((o) => o.id === form.ownerId)
        const finalOwnerId = isSuperAdmin ? form.ownerId! : user.id
        const finalOwnerEmail = isSuperAdmin && selectedOwner ? selectedOwner.email : user.email

        // 1. Send API request & WAIT for backend MongoDB insertion with ImageKit URL
        const created = await createProperty.mutateAsync({
          ownerId: finalOwnerId,
          ownerEmail: finalOwnerEmail,
          name: form.name.trim(),
          type: form.type as PropertyRecord['type'],
          description: form.description.trim() || undefined,
          totalUnits,
          bedrooms,
          bathrooms,
          parking,
          areaSqFt,
          monthlyRent,
          securityDeposit,
          salePrice,
          address: addressPayload,
          imageUrl: uploadedImageUrl!,
          images: [uploadedImageUrl!],
        })

        // 2. Sync to local store so offline/local views match MongoDB state
        addLocal({
          id: created.id,
          name: created.name,
          type: created.type as LocalPropertyType,
          description: created.description ?? undefined,
          totalUnits: created.totalUnits ?? totalUnits,
          occupiedUnits: created.occupiedUnits ?? 0,
          bedrooms: (created as any).bedrooms ?? bedrooms,
          bathrooms: (created as any).bathrooms ?? bathrooms,
          parking: (created as any).parking ?? parking,
          areaSqFt: (created as any).areaSqFt ?? areaSqFt,
          monthlyRent: (created as any).monthlyRent ?? monthlyRent,
          securityDeposit: (created as any).securityDeposit ?? securityDeposit,
          salePrice: (created as any).salePrice ?? salePrice,
          address: {
            line1: created.address.line1,
            line2: created.address.line2 ?? undefined,
            city: created.address.city,
            state: created.address.state,
            postalCode: created.address.postalCode,
            country: created.address.country,
          },
          listingStatus: 'for-rent',
          imageUrl: created.imageUrl,
          ownerEmail: finalOwnerEmail,
          ownerId: finalOwnerId,
        })

        // 3. ONLY THEN show success toast & close modal
        toast.success('Property Added Successfully', {
          description: `"${created.name}" has been created and stored in MongoDB with ImageKit image.`,
        })
        onOpenChange(false)
      } else {
        if (!property) return

        // 1. Send API update & WAIT for backend
        const updated = await updateProperty.mutateAsync({
          id: property.id,
          input: {
            name: form.name.trim(),
            type: form.type as PropertyRecord['type'],
            description: form.description.trim() || null,
            totalUnits,
            bedrooms,
            bathrooms,
            parking,
            areaSqFt,
            monthlyRent,
            securityDeposit,
            salePrice,
            address: addressPayload,
            ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl, images: [uploadedImageUrl] } : {}),
          },
        })

        // 2. Sync to local store
        updateLocal(property.id, {
          name: updated.name,
          type: updated.type as LocalPropertyType,
          description: updated.description ?? undefined,
          totalUnits: updated.totalUnits ?? totalUnits,
          bedrooms: (updated as any).bedrooms ?? bedrooms,
          bathrooms: (updated as any).bathrooms ?? bathrooms,
          parking: (updated as any).parking ?? parking,
          areaSqFt: (updated as any).areaSqFt ?? areaSqFt,
          monthlyRent: (updated as any).monthlyRent ?? monthlyRent,
          securityDeposit: (updated as any).securityDeposit ?? securityDeposit,
          salePrice: (updated as any).salePrice ?? salePrice,
          imageUrl: updated.imageUrl,
          address: {
            line1: updated.address.line1,
            line2: updated.address.line2 ?? undefined,
            city: updated.address.city,
            state: updated.address.state,
            postalCode: updated.address.postalCode,
            country: updated.address.country,
          },
        })

        // 3. ONLY THEN show success toast & close modal
        toast.success('Property Updated Successfully', {
          description: `"${updated.name}" has been updated.`,
        })
        onOpenChange(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Property creation failed.'
      toast.error(mode === 'create' ? 'Property creation failed' : 'Property update failed', {
        description: message,
      })
    }
  }

  const title = mode === 'create' ? 'Add Property' : 'Edit Property'
  const submitLabel = mode === 'create' ? 'Create Property' : 'Save Changes'

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (isPending) return // prevent close while submitting
        onOpenChange(next)
      }}
      title={title}
      description={
        mode === 'create'
          ? 'Fill in the details below to add a new property to your portfolio.'
          : 'Update the property details. Changes are saved immediately.'
      }
      size="xl"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="property-form"
            loading={isPending}
            disabled={isPending}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-6">
          {/* Section 1: Property Details */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <Building2 className="h-4 w-4 text-primary" /> Property Details
            </h3>

            {isSuperAdmin && mode === 'create' && (
              <Select
                id="property-owner"
                label="Property Owner"
                placeholder="Select owner"
                options={owners.map((o) => ({ value: o.id, label: `${o.name} (${o.email})` }))}
                value={form.ownerId || ''}
                onChange={update('ownerId')}
                error={touched ? errors.ownerId : undefined}
                disabled={isPending}
                required
              />
            )}

            <Input
              id="property-name"
              label="Property Name"
              placeholder="e.g. Sunset Residences Block A"
              value={form.name}
              onChange={update('name')}
              error={touched ? errors.name : undefined}
              disabled={isPending}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                id="property-type"
                label="Type"
                placeholder="Select type"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={update('type')}
                error={touched ? errors.type : undefined}
                disabled={isPending}
                required
              />

              <Input
                id="property-units"
                label="Total Units"
                type="number"
                placeholder="e.g. 12"
                min={0}
                max={99999}
                value={form.totalUnits}
                onChange={update('totalUnits')}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="property-bedrooms"
                label="Bedrooms (BHK)"
                type="number"
                placeholder="e.g. 3"
                min={0}
                value={form.bedrooms}
                onChange={update('bedrooms')}
                disabled={isPending}
              />

              <Input
                id="property-bathrooms"
                label="Bathrooms"
                type="number"
                placeholder="e.g. 2"
                min={0}
                value={form.bathrooms}
                onChange={update('bathrooms')}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="property-parking"
                label="Parking Spaces"
                type="number"
                placeholder="e.g. 1"
                min={0}
                value={form.parking}
                onChange={update('parking')}
                disabled={isPending}
              />

              <Input
                id="property-area"
                label="Total Area (sq ft)"
                type="number"
                placeholder="e.g. 1500"
                min={0}
                value={form.areaSqFt}
                onChange={update('areaSqFt')}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="property-desc" className="text-xs font-semibold text-text/80 tracking-wide">
                Description <span className="text-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="property-desc"
                rows={3}
                placeholder="Brief description of the property…"
                value={form.description}
                onChange={update('description')}
                disabled={isPending}
                className="glass-input w-full resize-none min-h-[100px]"
              />
            </div>
          </div>

          {/* Section 2: Financial Details */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Financial Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {property?.listingStatus === 'for-sale' ? (
                <>
                  <Input
                    id="property-rent"
                    label="Monthly Rent (₹)"
                    type="number"
                    placeholder="e.g. 25000"
                    min={0}
                    value={form.monthlyRent}
                    onChange={update('monthlyRent')}
                    disabled={isPending}
                  />

                  <Input
                    id="property-sale"
                    label="Sale Price (₹)"
                    type="number"
                    placeholder="e.g. 7500000"
                    min={0}
                    value={form.salePrice}
                    onChange={update('salePrice')}
                    disabled={isPending}
                  />

                  <Input
                    id="property-deposit"
                    label="Security Deposit (₹)"
                    type="number"
                    placeholder="e.g. 50000"
                    min={0}
                    value={form.securityDeposit}
                    onChange={update('securityDeposit')}
                    error={touched ? errors.securityDeposit : undefined}
                    disabled={isPending}
                    containerClassName="col-span-2"
                  />
                </>
              ) : (
                <>
                  <Input
                    id="property-rent"
                    label="Monthly Rent (₹)"
                    type="number"
                    placeholder="e.g. 25000"
                    min={0}
                    value={form.monthlyRent}
                    onChange={update('monthlyRent')}
                    disabled={isPending}
                  />

                  <Input
                    id="property-deposit"
                    label="Security Deposit (₹)"
                    type="number"
                    placeholder="e.g. 50000"
                    min={0}
                    value={form.securityDeposit}
                    onChange={update('securityDeposit')}
                    error={touched ? errors.securityDeposit : undefined}
                    disabled={isPending}
                  />
                </>
              )}
            </div>
          </div>

          {/* Section 3: Location Details */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <MapPin className="h-4 w-4 text-cyan-400" /> Location Details
            </h3>

            <Input
              id="property-line1"
              label="Address Line 1"
              placeholder="Street address, P.O. box, etc."
              value={form.line1}
              onChange={update('line1')}
              error={touched ? errors.line1 : undefined}
              disabled={isPending}
              required
            />

            <Input
              id="property-line2"
              label="Address Line 2"
              placeholder="Apt, suite, unit, floor (optional)"
              value={form.line2}
              onChange={update('line2')}
              disabled={isPending}
            />

            <div className="grid grid-cols-2 gap-4">
              <div ref={autocompleteRef} className="relative flex flex-col">
                <Input
                  id="property-city"
                  label="City"
                  placeholder="e.g. San Francisco"
                  value={form.city}
                  onChange={handleCityChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  error={touched ? errors.city : undefined}
                  disabled={isPending}
                  required
                  autoComplete="off"
                />

                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-[70px] z-50 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface/90 shadow-2xl p-1.5 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
                    <ul role="listbox" className="flex flex-col gap-0.5">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          role="option"
                          aria-selected={index === selectedIndex}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "px-3.5 py-2 text-sm rounded-lg cursor-pointer transition-all duration-150 text-left font-medium",
                            index === selectedIndex
                              ? "bg-primary text-white shadow-sm"
                              : "text-text2 hover:bg-surface-2 hover:text-text"
                          )}
                        >
                          {suggestion.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Input
                id="property-state"
                label="State / Province"
                placeholder="e.g. CA"
                value={form.state}
                onChange={update('state')}
                error={touched ? errors.state : undefined}
                disabled={isPending}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="property-postal"
                label="Postal Code"
                placeholder="e.g. 94102"
                value={form.postalCode}
                onChange={update('postalCode')}
                error={touched ? errors.postalCode : undefined}
                disabled={isPending}
                required
              />

              <Select
                id="property-country"
                label="Country"
                options={COUNTRY_OPTIONS}
                value={form.country}
                onChange={update('country')}
                error={touched ? errors.country : undefined}
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* Section 4: Property Images */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" /> Property Images
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text/80 tracking-wide">
                Upload Photos <span className="text-muted font-normal">(max 10, 5MB each)</span>
              </label>
              <input
                type="file"
                id="property-images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={isPending}
                className="sr-only"
                aria-label="Upload property images"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById('property-images')?.click()}
                disabled={isPending}
                className="w-fit hover:bg-surface2/80 rounded-lg px-4"
              >
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Select Images
              </Button>
              {touched && errors.image && (
                <p className="text-xs font-semibold text-danger">{errors.image}</p>
              )}
            </div>

            {form.imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {form.imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-surface2/50 border border-border/50 group">
                    <img
                      src={preview}
                      alt={`Property image ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-20"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-white rounded shadow-sm z-20">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.imagePreviews.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl bg-surface/10">
                <Image className="h-10 w-10 mx-auto text-muted/40 mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-muted">No images uploaded yet</p>
                <p className="text-xs text-muted/60 mt-1">Add photos to make your property more attractive</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
