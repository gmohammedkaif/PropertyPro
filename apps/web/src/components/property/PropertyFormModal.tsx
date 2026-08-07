import { useEffect, useState } from 'react'
import { Upload, Image, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperty'
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore, type LocalPropertyType } from '@/stores/localPropertiesStore'
import type { PropertyRecord } from '@propertypro/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  type: string
  description: string
  totalUnits: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  images: File[]
  imagePreviews: string[]
}

interface FormErrors {
  name?: string
  type?: string
  line1?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
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

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = 'Property name is required'
  if (!data.type) errors.type = 'Property type is required'
  if (!data.line1.trim()) errors.line1 = 'Address is required'
  if (!data.city.trim()) errors.city = 'City is required'
  if (!data.state.trim()) errors.state = 'State / province is required'
  if (!data.postalCode.trim()) errors.postalCode = 'Postal code is required'
  if (!data.country) errors.country = 'Country is required'
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
      line1: property.address.line1,
      line2: property.address.line2 ?? '',
      city: property.address.city,
      state: property.address.state,
      postalCode: property.address.postalCode,
      country: property.address.country,
      images: [],
      imagePreviews: property.images ?? [],
    }
  }
  return {
    name: '',
    type: '',
    description: '',
    totalUnits: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    images: [],
    imagePreviews: [],
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

  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const isPending = createProperty.isPending || updateProperty.isPending

  const [form, setForm] = useState<FormData>(() => defaultForm(property))
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)

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
      setErrors(validate({ ...form, [field]: value }))
    }
  }

  const { add: addLocal, update: updateLocal } = useLocalPropertiesStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const validationErrors = validate(form)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    if (!user) {
      toast.error('You must be logged in to add a property.')
      return
    }

    const totalUnits = form.totalUnits ? parseInt(form.totalUnits, 10) : 0

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
        // 1. Send API request & WAIT for backend MongoDB insertion
        const created = await createProperty.mutateAsync({
          ownerId: user.id,
          name: form.name.trim(),
          type: form.type as PropertyRecord['type'],
          description: form.description.trim() || undefined,
          totalUnits,
          address: addressPayload,
        })

        // 2. Sync to local store so offline/local views match MongoDB state
        addLocal({
          name: created.name,
          type: created.type as LocalPropertyType,
          description: created.description ?? undefined,
          totalUnits: created.totalUnits ?? totalUnits,
          occupiedUnits: created.occupiedUnits ?? 0,
          address: {
            line1: created.address.line1,
            line2: created.address.line2 ?? undefined,
            city: created.address.city,
            state: created.address.state,
            postalCode: created.address.postalCode,
            country: created.address.country,
          },
          listingStatus: 'for-rent',
          ownerEmail: user.email,
        })

        // 3. ONLY THEN show success toast & close modal
        toast.success('Property Added Successfully', {
          description: `"${created.name}" has been created and stored in the database.`,
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
            address: addressPayload,
          },
        })

        // 2. Sync to local store
        updateLocal(property.id, {
          name: updated.name,
          type: updated.type as LocalPropertyType,
          description: updated.description ?? undefined,
          totalUnits: updated.totalUnits ?? totalUnits,
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
      // If backend fails, show proper error message — DO NOT show success toast
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
        <div className="flex flex-col gap-5">
          {/* Basic info */}
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Property Details
            </legend>

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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="property-desc" className="text-xs font-medium text-text2">
                Description <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="property-desc"
                rows={3}
                placeholder="Brief description of the property…"
                value={form.description}
                onChange={update('description')}
                disabled={isPending}
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </fieldset>

          {/* Property Images */}
          <fieldset className="flex flex-col gap-4 border-t border-border pt-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Property Images
            </legend>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text2">
                Upload Photos <span className="text-muted">(max 10, 5MB each)</span>
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
                className="w-fit"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Select Images
              </Button>
            </div>

            {form.imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {form.imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-surface2 border border-border">
                    <img
                      src={preview}
                      alt={`Property image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-white rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.imagePreviews.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl">
                <Image className="h-10 w-10 mx-auto text-muted/50 mb-2" aria-hidden="true" />
                <p className="text-sm text-muted">No images uploaded yet</p>
                <p className="text-xs text-muted/70 mt-1">Add photos to make your property more attractive</p>
              </div>
            )}
          </fieldset>

          {/* Address */}
          <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Address
            </legend>

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

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="property-city"
                label="City"
                placeholder="e.g. San Francisco"
                value={form.city}
                onChange={update('city')}
                error={touched ? errors.city : undefined}
                disabled={isPending}
                required
              />

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

            <div className="grid grid-cols-2 gap-3">
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
          </fieldset>
        </div>
      </form>
    </Modal>
  )
}
