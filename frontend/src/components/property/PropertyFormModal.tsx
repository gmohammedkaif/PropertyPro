import { useEffect, useState, useRef } from 'react'
import { Upload, Image, X, Building2, DollarSign, MapPin, Sparkles, Layers, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperty'
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore, type LocalPropertyType } from '@/stores/localPropertiesStore'
import { useAdminOwners } from '@/hooks/useAdmin'
import type { PropertyRecord, PropertyUnit } from '@/shared'
import { COUNTRY_LIST } from '@/shared/countries'
import { generatePropertyUnitNames } from '@/lib/unitUtils'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'
import { cn } from '@/lib/utils'

// ── Client-side canvas image compression for property photos ──────────────────
async function compressImageToCanvas(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let width = img.width
      let height = img.height

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = url
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  type: string
  description: string
  totalUnits: string
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
  amenities: string[]
  units: PropertyUnit[]
}

interface FormErrors {
  name?: string
  type?: string
  totalUnits?: string
  line1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  image?: string
  ownerId?: string
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
  { value: 'resort', label: 'Resort' },
]

const COUNTRY_OPTIONS = COUNTRY_LIST.map((c) => ({ value: c, label: c }))

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
  
  const count = parseInt(data.totalUnits, 10)
  if (isNaN(count) || count <= 0) {
    errors.totalUnits = 'Total units must be at least 1'
  }

  if (mode === 'create' && data.images.length === 0 && data.imagePreviews.length === 0) {
    errors.image = 'Please upload at least one property image.'
  }
  if (isSuperAdmin && mode === 'create' && !data.ownerId) {
    errors.ownerId = 'Please select a property owner.'
  }
  return errors
}

function hasErrors(errors: FormErrors) {
  return Object.keys(errors).length > 0
}

// ─── Default form state ───────────────────────────────────────────────────────

function defaultForm(property?: PropertyRecord): FormData {
  if (property) {
    const existingImages = property.images && property.images.length > 0
      ? property.images
      : (property.imageUrl ? [property.imageUrl] : [])

    const unitsCount = property.units?.length || property.totalUnits || 1

    return {
      name: property.name,
      type: property.type,
      description: property.description ?? '',
      totalUnits: String(unitsCount),
      salePrice: String((property as any).salePrice ?? ''),
      line1: property.address.line1,
      line2: property.address.line2 ?? '',
      city: property.address.city,
      state: property.address.state,
      postalCode: property.address.postalCode,
      country: property.address.country || 'India',
      images: [],
      imagePreviews: existingImages,
      ownerId: property.ownerId,
      amenities: property.amenities ?? [],
      units: property.units ?? [],
    }
  }
  return {
    name: '',
    type: 'house',
    description: '',
    totalUnits: '1',
    salePrice: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    images: [],
    imagePreviews: [],
    ownerId: '',
    amenities: [],
    units: [],
  }
}

const AVAILABLE_AMENITIES = [
  '24/7 Power Backup',
  'High Speed Wifi',
  'Elevator / Lift',
  'Gym & Fitness',
  'Covered Parking',
  'Gated Community',
  'Swimming Pool',
  'CCTV Surveillance',
  'Water Supply 24h',
  'Security Guard',
  'Visitor Parking',
  'Clubhouse',
]

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
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const isPending = createProperty.isPending || updateProperty.isPending || uploadingImages

  const [form, setForm] = useState<FormData>(() => defaultForm(property))
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)

  // Track property type changes to regenerate unit labels when type changes
  const prevTypeRef = useRef(form.type)

  // Autocomplete search states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [shouldSearch, setShouldSearch] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Sync unit configurations whenever totalUnits or type changes
  useEffect(() => {
    const count = parseInt(form.totalUnits, 10)
    if (isNaN(count) || count <= 0) return

    const typeChanged = prevTypeRef.current !== form.type
    prevTypeRef.current = form.type

    const defaultNames = generatePropertyUnitNames(form.type, count)

    setForm((prev) => {
      const existingUnits = prev.units || []
      const nextUnits: PropertyUnit[] = defaultNames.map((unitName, i) => {
        const existing = existingUnits[i]
        const unitNumber = (!typeChanged && existing?.unitNumber) ? existing.unitNumber : unitName
        const floor = (!typeChanged && existing?.floor) ? existing.floor : (form.type === 'house' ? unitName : `Floor ${Math.floor(i / 4) + 1}`)

        return {
          unitNumber,
          bedrooms: existing?.bedrooms ?? 1,
          bathrooms: existing?.bathrooms ?? 1,
          parking: existing?.parking ?? 0,
          areaSqFt: existing?.areaSqFt ?? 500,
          monthlyRent: existing?.monthlyRent ?? 10000,
          securityDeposit: existing?.securityDeposit ?? 20000,
          floor,
        }
      })
      return { ...prev, units: nextUnits }
    })
  }, [form.totalUnits, form.type, property])

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
        country: matchedCountry ? matchedCountry.value : (suggestion.country || prev.country),
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

  // Immediate ImageKit upload on file selection with Max 5 validation & Canvas compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = '' // Reset input

    const currentTotal = form.imagePreviews.length
    if (currentTotal >= 5) {
      toast.error('Maximum 5 Images Allowed', { description: 'You can upload a maximum of 5 images per property.' })
      return
    }

    const maxAllowed = Math.max(0, 5 - currentTotal)
    if (files.length > maxAllowed) {
      toast.error('Limit Exceeded', { description: `You can only add ${maxAllowed} more image(s). Maximum total is 5.` })
    }

    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, maxAllowed)
    if (validFiles.length === 0) {
      toast.error('Invalid Files', { description: 'Please select valid image files under 10MB.' })
      return
    }

    if (uploadingImages) return
    setUploadingImages(true)
    setUploadProgressText(`Uploading ${validFiles.length} image(s)...`)

    const newlyUploadedUrls: string[] = []

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        setUploadProgressText(`Uploading image ${i + 1} of ${validFiles.length}...`)

        // 1. Canvas compress property photo to max 1280px (~150KB) for instant, lightweight upload
        const base64Data = await compressImageToCanvas(file, 1280, 0.85)

        // 2. Upload to ImageKit with explicit 60s timeout
        const uploadRes = await apiClient.post<{ data: { url: string } }>(
          '/properties/upload-image',
          {
            file: base64Data,
            fileName: file.name || `property_${Date.now()}_${i}.jpg`,
          },
          { timeout: 60_000 }
        )

        if (uploadRes.data?.data?.url) {
          newlyUploadedUrls.push(uploadRes.data.data.url)
        }
      }

      if (newlyUploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          imagePreviews: [...prev.imagePreviews, ...newlyUploadedUrls],
        }))
        setErrors((prev) => ({ ...prev, image: undefined }))
        toast.success(`Successfully uploaded ${newlyUploadedUrls.length} property image(s)!`)
      }
    } catch (uploadErr: any) {
      console.error('Property image upload failed:', uploadErr)
      toast.error('ImageKit Upload Failed', {
        description: 'Failed to upload property image. Please try again.',
      })
    } finally {
      setUploadingImages(false)
      setUploadProgressText('')
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }))
  }

  // Unit field editor handler
  const handleUnitChange = (index: number, field: keyof PropertyUnit, value: any) => {
    setForm(prev => {
      const updatedUnits = [...prev.units]
      if (updatedUnits[index]) {
        updatedUnits[index] = { ...updatedUnits[index], [field]: value }
      }
      return { ...prev, units: updatedUnits }
    })
  }

  // Reset form when modal opens / property changes
  useEffect(() => {
    if (open) {
      setForm(defaultForm(property))
      setErrors({})
      setTouched(false)
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

    const primaryImageUrl = form.imagePreviews[0] || ''

    if (mode === 'create' && form.imagePreviews.length === 0) {
      setErrors((prev) => ({ ...prev, image: 'Please upload at least one property image.' }))
      toast.error('Image Required', { description: 'Please upload at least one property image.' })
      return
    }

    const totalUnits = form.units.length > 0 ? form.units.length : (form.totalUnits ? parseInt(form.totalUnits, 10) : 1)
    const rootRent = form.units[0]?.monthlyRent ?? 0
    const rootDeposit = form.units[0]?.securityDeposit ?? 0
    const rootBhk = form.units[0]?.bedrooms ?? 1
    const rootBaths = form.units[0]?.bathrooms ?? 1
    const rootParking = form.units[0]?.parking ?? 0
    const rootArea = form.units[0]?.areaSqFt ?? 500
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
        const selectedOwner = isSuperAdmin ? owners.find((o) => o.id === form.ownerId) : null
        const finalOwnerId = isSuperAdmin && form.ownerId ? form.ownerId : user.id
        const finalOwnerEmail = isSuperAdmin && selectedOwner ? selectedOwner.email : user.email

        const created = await createProperty.mutateAsync({
          ownerId: finalOwnerId,
          ownerEmail: finalOwnerEmail,
          name: form.name.trim(),
          type: form.type as PropertyRecord['type'],
          description: form.description.trim() || undefined,
          totalUnits,
          bedrooms: rootBhk,
          bathrooms: rootBaths,
          parking: rootParking,
          areaSqFt: rootArea,
          monthlyRent: rootRent,
          securityDeposit: rootDeposit,
          salePrice,
          address: addressPayload,
          imageUrl: primaryImageUrl,
          images: form.imagePreviews,
          units: form.units,
          amenities: Array.from(new Set(form.amenities)),
        })

        addLocal({
          id: created.id,
          name: created.name,
          type: created.type as LocalPropertyType,
          description: created.description ?? undefined,
          totalUnits: created.totalUnits ?? totalUnits,
          occupiedUnits: created.occupiedUnits ?? 0,
          bedrooms: rootBhk,
          bathrooms: rootBaths,
          parking: rootParking,
          areaSqFt: rootArea,
          monthlyRent: rootRent,
          securityDeposit: rootDeposit,
          salePrice,
          units: form.units,
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
          images: form.imagePreviews,
          ownerEmail: finalOwnerEmail,
          ownerId: finalOwnerId,
        })

        toast.success('Property Added Successfully', {
          description: `"${created.name}" has been created with ${form.imagePreviews.length} images and ${form.units.length} units.`,
        })
        onOpenChange(false)
      } else {
        if (!property) return

        const updated = await updateProperty.mutateAsync({
          id: property.id,
          input: {
            name: form.name.trim(),
            type: form.type as PropertyRecord['type'],
            description: form.description.trim() || null,
            totalUnits,
            bedrooms: rootBhk,
            bathrooms: rootBaths,
            parking: rootParking,
            areaSqFt: rootArea,
            monthlyRent: rootRent,
            securityDeposit: rootDeposit,
            salePrice,
            address: addressPayload,
            units: form.units,
            amenities: Array.from(new Set(form.amenities)),
            ...(primaryImageUrl ? { imageUrl: primaryImageUrl, images: form.imagePreviews } : {}),
          },
        })

        updateLocal(property.id, {
          name: updated.name,
          type: updated.type as LocalPropertyType,
          description: updated.description ?? undefined,
          totalUnits: updated.totalUnits ?? totalUnits,
          bedrooms: rootBhk,
          bathrooms: rootBaths,
          parking: rootParking,
          areaSqFt: rootArea,
          monthlyRent: rootRent,
          securityDeposit: rootDeposit,
          salePrice,
          imageUrl: updated.imageUrl,
          images: form.imagePreviews,
          units: form.units,
          address: {
            line1: updated.address.line1,
            line2: updated.address.line2 ?? undefined,
            city: updated.address.city,
            state: updated.address.state,
            postalCode: updated.address.postalCode,
            country: updated.address.country,
          },
        })

        toast.success('Property Updated Successfully', {
          description: `"${updated.name}" has been updated with ${form.units.length} units.`,
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
        if (isPending) return
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
                label="Property Type"
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
                placeholder="e.g. 4"
                min={1}
                max={99999}
                value={form.totalUnits}
                onChange={update('totalUnits')}
                error={touched ? errors.totalUnits : undefined}
                disabled={isPending}
                required
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

          {/* Section: Individual Unit Configurations */}
          {form.units.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
                <Layers className="h-4 w-4 text-sky-400" /> Individual Unit Specifications ({form.units.length} Units)
              </h3>
              <p className="text-xs text-muted -mt-2">
                Configure specific BHK, area, rent, and deposits for each individual unit.
              </p>

              <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
                {form.units.map((unit, idx) => (
                  <div key={idx} className="rounded-xl border border-border/40 bg-surface2/30 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-primary">
                        UNIT {idx + 1}: {unit.unitNumber}
                      </span>
                      <span className="text-[10px] text-muted uppercase font-semibold">
                        {unit.floor || 'Standard Floor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Unit Label</label>
                        <input
                          type="text"
                          value={unit.unitNumber}
                          onChange={(e) => handleUnitChange(idx, 'unitNumber', e.target.value)}
                          className="glass-input w-full text-xs py-1.5 px-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Bedrooms (BHK)</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.bedrooms ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'bedrooms', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Bathrooms</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.bathrooms ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'bathrooms', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Parking</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.parking ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'parking', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Area (sq ft)</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.areaSqFt ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'areaSqFt', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Monthly Rent (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.monthlyRent ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'monthlyRent', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2 text-emerald-400 font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-muted uppercase block mb-1">Security Deposit (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={unit.securityDeposit ?? ''}
                          onChange={(e) => handleUnitChange(idx, 'securityDeposit', Number(e.target.value))}
                          className="glass-input w-full text-xs py-1.5 px-2 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Amenities & Facilities */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Amenities & Facilities
            </h3>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isSelected = form.amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => {
                      setForm((prev) => {
                        const exists = prev.amenities.includes(amenity)
                        const next = exists
                          ? prev.amenities.filter((a) => a !== amenity)
                          : [...prev.amenities, amenity]
                        return { ...prev, amenities: Array.from(new Set(next)) }
                      })
                    }}
                    disabled={isPending}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border/40 bg-surface2/30 text-text hover:border-border'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="truncate">{amenity}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section: Financial & Sale Options */}
          {form.salePrice !== '' && (
            <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" /> Sale Details (Optional)
              </h3>

              <Input
                id="property-sale-price"
                label="Sale Price (₹)"
                type="number"
                placeholder="e.g. 5000000"
                min={0}
                value={form.salePrice}
                onChange={update('salePrice')}
                disabled={isPending}
              />
            </div>
          )}

          {/* Section: Property Photos (Max 5) */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2.5 mb-1.5">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Image className="h-4 w-4 text-purple-400" /> Property Photos (Max 5)
              </h3>
              <span className="text-[11px] font-semibold text-muted">
                {form.imagePreviews.length} / 5 uploaded
              </span>
            </div>

            {form.imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {form.imagePreviews.map((preview, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-surface2/50">
                    <img src={preview} alt={`Property Photo ${idx + 1}`} className="h-full w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={isPending}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.imagePreviews.length < 5 && (
              <label className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-surface2/20 p-6 transition-colors",
                uploadingImages ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:border-primary/50 hover:bg-surface2/40"
              )}>
                {uploadingImages ? (
                  <>
                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                    <span className="text-xs font-semibold text-primary">{uploadProgressText || 'Uploading images to ImageKit...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted mb-2" />
                    <span className="text-xs font-medium text-text">Click to upload photo(s)</span>
                    <span className="text-[10px] text-muted mt-0.5">PNG, JPG, WEBP (Max 5 total)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isPending || uploadingImages}
                  className="hidden"
                />
              </label>
            )}

            {touched && errors.image && (
              <p className="text-xs font-medium text-red-400">{errors.image}</p>
            )}
          </div>

          {/* Section: Address Details */}
          <div className="rounded-2xl border border-border/40 bg-surface/20 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2.5 mb-1.5">
              <MapPin className="h-4 w-4 text-sky-400" /> Address Details
            </h3>

            <Input
              id="property-line1"
              label="Address Line 1"
              placeholder="e.g. 123 Main St, Block B"
              value={form.line1}
              onChange={update('line1')}
              error={touched ? errors.line1 : undefined}
              disabled={isPending}
              required
            />

            <Input
              id="property-line2"
              label="Address Line 2 (optional)"
              placeholder="e.g. Suite 4B or Landmark"
              value={form.line2}
              onChange={update('line2')}
              disabled={isPending}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={autocompleteRef}>
                <Input
                  id="property-city"
                  label="City"
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={handleCityChange}
                  onKeyDown={handleKeyDown}
                  error={touched ? errors.city : undefined}
                  disabled={isPending}
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg py-1">
                    {suggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        className={`cursor-pointer px-3 py-2 text-xs transition-colors ${
                          idx === selectedIndex ? 'bg-primary/20 text-primary font-semibold' : 'text-text hover:bg-surface2'
                        }`}
                      >
                        <div className="font-semibold">{item.label}</div>
                        <div className="text-[10px] text-muted">
                          {item.state ? `${item.state}, ` : ''}{item.country}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Input
                id="property-state"
                label="State / Province"
                placeholder="e.g. Maharashtra"
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
                placeholder="e.g. 400001"
                value={form.postalCode}
                onChange={update('postalCode')}
                error={touched ? errors.postalCode : undefined}
                disabled={isPending}
                required
              />

              <Select
                id="property-country"
                label="Country"
                placeholder="Select country"
                options={COUNTRY_OPTIONS}
                value={form.country}
                onChange={update('country')}
                error={touched ? errors.country : undefined}
                disabled={isPending}
                required
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
