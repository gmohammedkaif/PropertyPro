import { useState } from 'react'
import {
  Building2,
  DollarSign,
  Plus,
  Search,
  Trash2,
  Edit,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { StatsCard } from '@/components/ui/StatsCard'
import { ActionsMenu } from '@/components/ui/ActionsMenu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { useToast } from '@/hooks/useToast'
import { useListingsStore, type ListingRecord, type ListingType, type ListingStatus } from '@/stores/listingsStore'
import { useConfirmStore } from '@/stores/confirmStore'

// Formatting helper
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function ListingsPage() {
  const toast = useToast()
  const { items, add, update, remove } = useListingsStore()

  // State
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ListingRecord | null>(null)

  // Form State
  const [propertyName, setPropertyName] = useState('')
  const [type, setType] = useState<ListingType>('rent')
  const [status, setStatus] = useState<ListingStatus>('available')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [areaSqFt, setAreaSqFt] = useState('')
  const [description, setDescription] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setPropertyName('')
    setType('rent')
    setStatus('available')
    setPrice('')
    setBedrooms('')
    setBathrooms('')
    setAreaSqFt('')
    setDescription('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: ListingRecord) => {
    setEditingItem(item)
    setPropertyName(item.propertyName)
    setType(item.type)
    setStatus(item.status)
    setPrice(String(item.price))
    setBedrooms(String(item.bedrooms ?? ''))
    setBathrooms(String(item.bathrooms ?? ''))
    setAreaSqFt(String(item.areaSqFt ?? ''))
    setDescription(item.description ?? '')
    setModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await useConfirmStore.getState().showConfirm({
      title: 'Remove Listing',
      message: `Are you sure you want to remove the listing for "${name}"?`
    })
    if (confirmed) {
      remove(id)
      toast.success('Listing removed successfully')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyName.trim()) {
      toast.error('Property name is required')
      return
    }
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    const payload = {
      propertyName: propertyName.trim(),
      type,
      status,
      price: numPrice,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      areaSqFt: areaSqFt ? parseInt(areaSqFt) : undefined,
      description: description.trim() || undefined,
    }

    if (editingItem) {
      update(editingItem.id, payload)
      toast.success('Listing updated successfully')
    } else {
      add(payload)
      toast.success('Listing added successfully')
    }
    setModalOpen(false)
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch = item.propertyName.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Stats
  const activeListings = items.filter((item) => item.status === 'available').length
  const totalRentValue = items.filter((item) => item.type === 'rent').reduce((sum, item) => sum + item.price, 0)
  const totalSales = items.filter((item) => item.type === 'sale').length

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Listings</h1>
          <p className="text-sm text-muted">Publish properties for lease or sale and track application statuses.</p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Listing
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Listings" value={String(items.length)} icon={Building2} />
        <StatsCard title="Active Listings" value={String(activeListings)} icon={Sparkles} />
        <StatsCard title="Monthly Rental Value" value={formatPrice(totalRentValue)} icon={DollarSign} />
        <StatsCard title="Properties for Sale" value={String(totalSales)} icon={Building2} />
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 max-w-md">
          <Input
            placeholder="Search listings..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'rent', label: 'Rent' },
              { value: 'sale', label: 'Sale' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'available', label: 'Available' },
              { value: 'under-offer', label: 'Under Offer' },
              { value: 'rented', label: 'Rented' },
              { value: 'sold', label: 'Sold' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Listing Type</TableHead>
              <TableHead>Specs</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted">
                  No listings found. Create a listing to get started.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-text">{item.propertyName}</TableCell>
                  <TableCell>
                    <Badge intent={item.type === 'rent' ? 'primary' : 'success'} size="sm">
                      {item.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {item.bedrooms ? `${item.bedrooms} BHK` : ''} {item.areaSqFt ? `• ${item.areaSqFt} Sq.Ft` : ''}
                  </TableCell>
                  <TableCell className="font-bold text-text">
                    {formatPrice(item.price)}
                    {item.type === 'rent' ? ' /mo' : ''}
                  </TableCell>
                  <TableCell>
                    <Badge
                      intent={
                        item.status === 'available'
                          ? 'success'
                          : item.status === 'under-offer'
                            ? 'warning'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {item.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu
                      items={[
                        {
                          label: 'Edit',
                          icon: Edit,
                          onClick: () => handleOpenEdit(item),
                        },
                        {
                          label: 'Delete',
                          icon: Trash2,
                          destructive: true,
                          onClick: () => handleDelete(item.id, item.propertyName),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingItem ? 'Edit Listing' : 'Create Listing'}
        description="Publish properties to find buyers or tenants."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Listing</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <Input
            label="Property Name"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="e.g. Hassan Villa"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Listing Type"
              options={[
                { value: 'rent', label: 'Rent' },
                { value: 'sale', label: 'Sale' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value as ListingType)}
            />
            <Select
              label="Status"
              options={[
                { value: 'available', label: 'Available' },
                { value: 'under-offer', label: 'Under Offer' },
                { value: 'rented', label: 'Rented' },
                { value: 'sold', label: 'Sold' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as ListingStatus)}
            />
          </div>
          <Input
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 45000"
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Bedrooms"
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="3"
            />
            <Input
              label="Bathrooms"
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="2"
            />
            <Input
              label="Area (Sq.Ft)"
              type="number"
              value={areaSqFt}
              onChange={(e) => setAreaSqFt(e.target.value)}
              placeholder="1800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text/80 tracking-wide">Description</label>
            <textarea
              className="glass-input w-full resize-none min-h-[100px]"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail descriptions, terms, features..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
