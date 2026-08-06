import { useState } from 'react'

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  Hash,
  Home,
  MapPin,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { PropertyFormModal } from '@/components/property/PropertyFormModal'
import { DeletePropertyDialog } from '@/components/property/DeletePropertyDialog'
import { useProperty } from '@/hooks/useProperty'
import { cn } from '@/lib/utils'
import type { PropertyRecord, PropertyStatus, PropertyType } from '@propertypro/shared'

// ─── Labels & maps ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  commercial: 'Commercial',
  mixed: 'Mixed Use',
}

const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; intent: 'success' | 'neutral' }
> = {
  active: { label: 'Active', intent: 'success' },
  archived: { label: 'Archived', intent: 'neutral' },
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">Property not found</h2>
        <p className="mt-1 text-sm text-muted">
          This property may have been removed or the link may be incorrect.
        </p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}

// ─── Stat strip item ──────────────────────────────────────────────────────────

function StatStrip({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface2">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="tabular text-xl font-bold text-text">{value}</p>
    </div>
  )
}

// ─── Property header ──────────────────────────────────────────────────────────

function PropertyHeader({
  property,
  onEdit,
  onDelete,
}: {
  property: PropertyRecord
  onEdit: () => void
  onDelete: () => void
}) {
  const statusCfg = STATUS_CONFIG[property.status]
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate('/app/properties')}
        className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Properties
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <span className="bg-brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md">
            <Home className="h-6 w-6" aria-hidden="true" />
          </span>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text">{property.name}</h1>
              <Badge intent={statusCfg.intent} size="sm">
                {statusCfg.label}
              </Badge>
              <Badge intent="neutral" size="sm">
                {TYPE_LABELS[property.type]}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {property.address.line1}, {property.address.city}, {property.address.state}{' '}
              {property.address.postalCode}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="md" onClick={onEdit}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button variant="danger" size="md" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail cards ──────────────────────────────────────────────────────────────

function DetailsCard({ property }: { property: PropertyRecord }) {
  const fields: { label: string; value: string }[] = [
    { label: 'Property ID', value: property.id },
    { label: 'Owner ID', value: property.ownerId },
    { label: 'Type', value: TYPE_LABELS[property.type] },
    { label: 'Status', value: STATUS_CONFIG[property.status].label },
    { label: 'Country', value: property.address.country },
    { label: 'Created', value: formatDate(property.createdAt) },
    { label: 'Last Updated', value: formatDate(property.updatedAt) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
        <CardDescription>Core information about this property.</CardDescription>
      </CardHeader>
      <CardContent className="mt-2">
        <dl className="divide-y divide-border">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5">
              <dt className="text-xs font-medium text-muted">{label}</dt>
              <dd
                className={cn(
                  'max-w-[60%] truncate text-right text-xs font-medium text-text',
                  label === 'Property ID' || label === 'Owner ID' ? 'tabular font-mono' : '',
                )}
                title={value}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function AddressCard({ property }: { property: PropertyRecord }) {
  const { address } = property
  const fullAddress = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <address className="not-italic">
            {fullAddress.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-text leading-relaxed">
                {line}
              </p>
            ))}
          </address>
        </div>
      </CardContent>
    </Card>
  )
}

function DescriptionCard({ property }: { property: PropertyRecord }) {
  if (!property.description) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="mt-2">
          <p className="text-sm text-muted italic">No description provided.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <p className="text-sm leading-relaxed text-text2">{property.description}</p>
      </CardContent>
    </Card>
  )
}

function AmenitiesCard({ property }: { property: PropertyRecord }) {
  const amenities = property.amenities ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
        <CardDescription>
          {amenities.length === 0 ? 'No amenities recorded.' : `${amenities.length} amenity${amenities.length === 1 ? '' : 'ies'} listed.`}
        </CardDescription>
      </CardHeader>
      {amenities.length > 0 ? (
        <CardContent className="mt-2">
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <Badge key={amenity} intent="neutral" size="sm">
                {amenity}
              </Badge>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: property, isLoading, error, refetch } = useProperty(id ?? '', !!id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <PageSkeleton />
  if (error || !property) return <ErrorState onRetry={() => void refetch()} />

  const occupancy =
    property.totalUnits && property.totalUnits > 0
      ? `${Math.round(((property.occupiedUnits ?? 0) / property.totalUnits) * 100)}%`
      : 'N/A'

  return (
    <div className="flex flex-col gap-6">
      <PropertyHeader
        property={property}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatStrip
          label="Total Units"
          value={property.totalUnits ? String(property.totalUnits) : '—'}
          icon={Building2}
        />
        <StatStrip
          label="Occupied"
          value={property.occupiedUnits ? String(property.occupiedUnits) : '0'}
          icon={Users}
        />
        <StatStrip label="Occupancy" value={occupancy} icon={Hash} />
        <StatStrip label="Listed" value={formatDate(property.createdAt)} icon={Calendar} />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column — main info */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DescriptionCard property={property} />
          <AmenitiesCard property={property} />
          <AddressCard property={property} />
        </div>

        {/* Right column — sidebar */}
        <div className="flex flex-col gap-4">
          <DetailsCard property={property} />
        </div>
      </div>

      {/* Modals */}
      <PropertyFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        property={property}
      />

      <DeletePropertyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        property={property}
        onDeleted={() => navigate('/app/properties')}
      />
    </div>
  )
}
