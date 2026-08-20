import { AlertCircle, Building, Calendar, Edit, Eye, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ActionsMenu } from '@/components/ui/ActionsMenu'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import type { PropertyRecord, PropertyStatus, PropertyType } from '@/shared'

export interface PropertyTableProps {
  data: PropertyRecord[]
  loading: boolean
  error: Error | null
  totalItems: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onRetry: () => void
  onAddProperty?: () => void
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  view?: 'table' | 'grid'
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  resort: 'Resort',
}

const STATUS_LABELS: Record<PropertyStatus, { label: string; intent: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'Active', intent: 'success' },
  archived: { label: 'Archived', intent: 'neutral' },
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const config = STATUS_LABELS[status]
  return (
    <Badge intent={config.intent} size="sm">
      {config.label}
    </Badge>
  )
}

function TypeBadge({ type }: { type: PropertyType }) {
  return (
    <Badge intent="neutral" size="sm">
      {PROPERTY_TYPE_LABELS[type]}
    </Badge>
  )
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function DesktopTable({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: PropertyRecord[]
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Monthly Rent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((property) => (
          <TableRow key={property.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-text">{property.name}</span>
                <span className="text-sm text-muted">{property.address.line1}</span>
              </div>
            </TableCell>
            <TableCell>
              <TypeBadge type={property.type} />
            </TableCell>
            <TableCell>{property.address.city}</TableCell>
            <TableCell className="tabular">{getPropertyRentDisplay(property)}</TableCell>
            <TableCell>
              <StatusBadge status={property.status} />
            </TableCell>
            <TableCell className="text-muted">{formatDate(property.createdAt)}</TableCell>
            <TableCell className="text-right">
              <ActionsMenu
                items={[
                  { label: 'View', icon: Eye, onClick: () => onView(property.id) },
                  ...(onEdit ? [{ label: 'Edit', icon: Edit, onClick: () => onEdit(property.id) }] : []),
                  ...(onDelete ? [{ label: 'Delete', icon: Trash2, onClick: () => onDelete(property.id), destructive: true }] : []),
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function MobileCards({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: PropertyRecord[]
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {data.map((property) => (
        <div
          key={property.id}
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text">{property.name}</span>
              <TypeBadge type={property.type} />
            </div>
            <p className="text-sm text-muted">{property.address.city}</p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <span>Created {formatDate(property.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <StatusBadge status={property.status} />
            <ActionsMenu
              align="end"
              items={[
                { label: 'View', icon: Eye, onClick: () => onView(property.id) },
                ...(onEdit ? [{ label: 'Edit', icon: Edit, onClick: () => onEdit(property.id) }] : []),
                ...(onDelete ? [{ label: 'Delete', icon: Trash2, onClick: () => onDelete(property.id), destructive: true }] : []),
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  )
}

function LoadingSkeletonTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Monthly Rent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1 h-3 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-14 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-text">Could not load properties</h3>
        <p className="mt-1 text-sm text-muted">There was an error loading the property list. Please try again.</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

const PROPERTY_TYPE_IMAGES: Record<PropertyType, string> = {
  apartment: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  house: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80',
  resort: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
}

function formatRupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function getPropertyRentDisplay(property: PropertyRecord): string {
  const isSale = (property as any).listingStatus === 'for-sale'
  const amount = isSale ? property.salePrice : property.monthlyRent
  if (amount !== undefined && amount !== null && amount > 0) {
    return formatRupee(amount) + (isSale ? '' : ' / month')
  }
  return 'Not specified'
}

function getPropertyUnitLabel(property: PropertyRecord): string {
  const typeLabel = PROPERTY_TYPE_LABELS[property.type] || 'Property'
  const units = property.totalUnits !== undefined && property.totalUnits !== null ? property.totalUnits : 1
  return `${typeLabel} · ${units} ${units === 1 ? 'Unit' : 'Units'}`
}

function GridCards({
  data,
  onView,
  onEdit,
  onDelete,
}: {
  data: PropertyRecord[]
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((property) => {
        const imageUrl = property.imageUrl || (property as any).images?.[0] || PROPERTY_TYPE_IMAGES[property.type] || PROPERTY_TYPE_IMAGES.house
        return (
          <div
            key={property.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 relative"
          >
            {/* Top lighting element */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Property Image Header */}
            <div className="relative h-48 w-full overflow-hidden bg-surface2/50">
              <img
                src={imageUrl}
                alt={property.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080b1a]/80 via-transparent to-transparent z-10" />
              <div className="absolute left-4 top-4 z-20">
                <StatusBadge status={property.status} />
              </div>
              <div className="absolute right-4 top-4 z-20">
                <TypeBadge type={property.type} />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-base font-extrabold text-text group-hover:text-primary transition-colors tracking-tight leading-snug">
                {property.name}
              </h3>
              <p className="mt-1 text-[10px] text-muted font-bold uppercase tracking-wider">
                {getPropertyUnitLabel(property)}
              </p>
              <p className="mt-2.5 text-xs text-text2 line-clamp-2 flex-1 leading-relaxed">
                {property.address.line1}, {property.address.city}
              </p>

              {/* Pricing & Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted/70">
                    {(property as any).listingStatus === 'for-sale' ? 'Sale Price' : 'Rent'}
                  </span>
                  <p className="text-base font-extrabold text-text font-display mt-0.5 tracking-tight">
                    {getPropertyRentDisplay(property)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-lg px-3" onClick={() => onView(property.id)}>
                    View Details
                  </Button>
                  {(onEdit || onDelete) && (
                    <ActionsMenu
                      align="end"
                      items={[
                        ...(onEdit ? [{ label: 'Edit', icon: Edit, onClick: () => onEdit(property.id) }] : []),
                        ...(onDelete ? [{ label: 'Delete', icon: Trash2, onClick: () => onDelete(property.id), destructive: true }] : []),
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PropertyTable({
  data,
  loading,
  error,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onRetry,
  onAddProperty,
  onView,
  onEdit,
  onDelete,
  view = 'grid',
}: PropertyTableProps) {
  if (error) {
    return <ErrorState onRetry={onRetry} />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="hidden sm:block">
          <LoadingSkeletonTable />
        </div>
        <div className="sm:hidden">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    if (!onAddProperty) {
      return (
        <EmptyState
          icon={<Building className="h-6 w-6" aria-hidden="true" />}
          title="No Properties Available"
          description="New rental properties will appear here when they become available."
        />
      )
    }
    return (
      <EmptyState
        icon={<Building className="h-6 w-6" aria-hidden="true" />}
        title="No properties found"
        description="Properties you create will appear here. Start by adding your first property."
        action={
          <Button onClick={onAddProperty}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Property
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{totalItems} properties found</p>

      {view === 'grid' ? (
        <GridCards data={data} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <>
          <div className="hidden sm:block">
            <DesktopTable data={data} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>

          <div className="sm:hidden">
            <MobileCards data={data} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  )
}
