import { useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
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
import { useBookingsStore, type BookingRecord, type BookingStatus } from '@/stores/bookingsStore'
import { useConfirmStore } from '@/stores/confirmStore'

export function BookingsPage() {
  const toast = useToast()
  const { items, add, update, remove } = useBookingsStore()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BookingRecord | null>(null)

  // Form State
  const [propertyName, setPropertyName] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [notes, setNotes] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setPropertyName('')
    setVisitorName('')
    setVisitorEmail('')
    setVisitorPhone('')
    setScheduledDate('')
    setScheduledTime('')
    setStatus('pending')
    setNotes('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: BookingRecord) => {
    setEditingItem(item)
    setPropertyName(item.propertyName)
    setVisitorName(item.visitorName)
    setVisitorEmail(item.visitorEmail)
    setVisitorPhone(item.visitorPhone ?? '')
    setScheduledDate(item.scheduledDate)
    setScheduledTime(item.scheduledTime)
    setStatus(item.status)
    setNotes(item.notes ?? '')
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await useConfirmStore.getState().showConfirm({
      title: 'Cancel Booking',
      message: 'Cancel and delete this viewing session booking?'
    })
    if (confirmed) {
      remove(id)
      toast.success('Booking cancelled successfully')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyName.trim() || !visitorName.trim() || !scheduledDate || !scheduledTime) {
      toast.error('All required fields must be filled')
      return
    }

    const payload = {
      propertyName: propertyName.trim(),
      visitorName: visitorName.trim(),
      visitorEmail: visitorEmail.trim(),
      visitorPhone: visitorPhone.trim() || undefined,
      scheduledDate,
      scheduledTime,
      status,
      notes: notes.trim() || undefined,
    }

    if (editingItem) {
      update(editingItem.id, payload)
      toast.success('Booking schedule updated')
    } else {
      add(payload)
      toast.success('Viewing session booked')
    }
    setModalOpen(false)
  }

  const handleUpdateStatus = (id: string, newStatus: BookingStatus) => {
    update(id, { status: newStatus })
    toast.success(`Booking status marked as ${newStatus}`)
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.visitorName.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const pendingBookings = items.filter((item) => item.status === 'pending').length
  const confirmedBookings = items.filter((item) => item.status === 'confirmed').length
  const completedBookings = items.filter((item) => item.status === 'completed').length
  const cancelledBookings = items.filter((item) => item.status === 'cancelled').length

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Site Bookings</h1>
          <p className="text-sm text-muted">Schedule and manage property walk-throughs, viewing requests, and open houses.</p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Schedule Viewing
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Pending Requests" value={String(pendingBookings)} icon={Clock} />
        <StatsCard title="Confirmed Visits" value={String(confirmedBookings)} icon={Calendar} />
        <StatsCard title="Completed Tours" value={String(completedBookings)} icon={CheckCircle2} />
        <StatsCard title="Cancelled Tours" value={String(cancelledBookings)} icon={Sparkles} />
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 max-w-md">
          <Input
            placeholder="Search visitor or property..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
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
              <TableHead>Visitor Details</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Scheduled Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted">
                  No viewings scheduled. Book a viewing session to populate this list.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text">{item.visitorName}</span>
                      <span className="text-xs text-muted">{item.visitorEmail} {item.visitorPhone ? `• ${item.visitorPhone}` : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-text font-medium">{item.propertyName}</TableCell>
                  <TableCell className="text-xs text-muted">{item.scheduledDate}</TableCell>
                  <TableCell className="text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted" />
                      {item.scheduledTime}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      intent={
                        item.status === 'confirmed'
                          ? 'success'
                          : item.status === 'pending'
                            ? 'warning'
                            : item.status === 'completed'
                              ? 'primary'
                              : 'danger'
                      }
                      size="sm"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu
                      items={[
                        ...(item.status === 'pending'
                          ? [
                              {
                                label: 'Confirm Visit',
                                onClick: () => handleUpdateStatus(item.id, 'confirmed'),
                              },
                            ]
                          : []),
                        ...(item.status === 'confirmed'
                          ? [
                              {
                                label: 'Complete Tour',
                                onClick: () => handleUpdateStatus(item.id, 'completed'),
                              },
                            ]
                          : []),
                        {
                          label: 'Edit Booking',
                          icon: Edit,
                          onClick: () => handleOpenEdit(item),
                        },
                        {
                          label: 'Cancel Booking',
                          icon: Trash2,
                          destructive: true,
                          onClick: () => handleDelete(item.id),
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
        title={editingItem ? 'Edit Booking' : 'Schedule Viewing Session'}
        description="Book property walking tours and client walkthrough schedules."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Booking</Button>
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
          <Input
            label="Visitor Name"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="e.g. Sneha Reddy"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Visitor Email"
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="visitor@email.com"
            />
            <Input
              label="Visitor Phone"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
            <Select
              label="Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text/80 tracking-wide">Booking Notes</label>
            <textarea
              className="glass-input w-full resize-none min-h-[100px]"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pre-approved, interested in quick purchase..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
