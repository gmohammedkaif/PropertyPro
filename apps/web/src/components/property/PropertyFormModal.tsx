import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { useCreateProperty, useUpdateProperty } from '@/hooks/useProperty'
import { useAuthStore } from '@/stores/authStore'
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
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PropertyFormModal({
  open,
  onOpenChange,
  property,
  onSuccess,
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

  // Reset form when the modal opens / property changes
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
      setErrors(validate({ ...form, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const validationErrors = validate(form)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    const totalUnits = form.totalUnits ? parseInt(form.totalUnits, 10) : undefined

    try {
      if (mode === 'create') {
        if (!user) return
        const created = await createProperty.mutateAsync({
          ownerId: user.id,
          name: form.name.trim(),
          type: form.type as PropertyRecord['type'],
          description: form.description.trim() || undefined,
          totalUnits,
          address: {
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country,
          },
        })
        toast.success('Property created', { description: `"${created.name}" has been added.` })
        onSuccess?.(created)
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
            address: {
              line1: form.line1.trim(),
              line2: form.line2.trim() || undefined,
              city: form.city.trim(),
              state: form.state.trim(),
              postalCode: form.postalCode.trim(),
              country: form.country,
            },
          },
        })
        toast.success('Property updated', { description: `"${updated.name}" has been saved.` })
        onSuccess?.(updated)
        onOpenChange(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(mode === 'create' ? 'Failed to create property' : 'Failed to update property', {
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
