import { useState } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Wrench,
  AlertOctagon,
  Hammer,
  ClipboardCheck,
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
import {
  useMaintenanceStore,
  type MaintenanceRecord,
  type MaintenancePriority,
  type MaintenanceStatus,
} from '@/stores/maintenanceStore'

export function MaintenancePage() {
  const toast = useToast()
  const { items, add, update, remove } = useMaintenanceStore()

  // State
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MaintenanceRecord | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [priority, setPriority] = useState<MaintenancePriority>('medium')
  const [status, setStatus] = useState<MaintenanceStatus>('open')
  const [reportedBy, setReportedBy] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPropertyName('')
    setPriority('medium')
    setStatus('open')
    setReportedBy('')
    setAssignedTo('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: MaintenanceRecord) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setPropertyName(item.propertyName)
    setPriority(item.priority)
    setStatus(item.status)
    setReportedBy(item.reportedBy ?? '')
    setAssignedTo(item.assignedTo ?? '')
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this maintenance request ticket?')) {
      remove(id)
      toast.success('Ticket deleted successfully')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !propertyName.trim()) {
      toast.error('Ticket title and property name are required')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      propertyName: propertyName.trim(),
      priority,
      status,
      reportedBy: reportedBy.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : undefined,
    }

    if (editingItem) {
      update(editingItem.id, payload)
      toast.success('Ticket updated successfully')
    } else {
      add(payload)
      toast.success('Maintenance ticket filed')
    }
    setModalOpen(false)
  }

  const handleUpdateStatus = (id: string, newStatus: MaintenanceStatus) => {
    update(id, {
      status: newStatus,
      resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : undefined,
    })
    toast.success(`Ticket status marked as ${newStatus}`)
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  // Stats
  const urgentTickets = items.filter((item) => item.priority === 'urgent' && item.status !== 'closed').length
  const openTickets = items.filter((item) => item.status === 'open').length
  const inProgressTickets = items.filter((item) => item.status === 'in-progress').length
  const resolvedTickets = items.filter((item) => item.status === 'resolved' || item.status === 'closed').length

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-text">Maintenance Requests</h1>
          <p className="text-sm text-muted">File repair issues, assign vendors, track resolving progress and costs.</p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          File Request
        </Button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Open Issues" value={String(openTickets)} icon={Wrench} />
        <StatsCard title="In Progress" value={String(inProgressTickets)} icon={Hammer} />
        <StatsCard title="Urgent Action" value={String(urgentTickets)} icon={AlertOctagon} className="border-danger/30 bg-danger-soft/10 text-danger" />
        <StatsCard title="Resolved Issues" value={String(resolvedTickets)} icon={ClipboardCheck} />
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 max-w-md">
          <Input
            placeholder="Search issue or property..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'All Priority' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
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
              <TableHead>Issue & Property</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Reporter / Assignee</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted">
                  No maintenance requests logged. File a request to populate this list.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col max-w-sm">
                      <span className="font-semibold text-text">{item.title}</span>
                      <span className="text-xs text-muted truncate">{item.propertyName} {item.description ? `• ${item.description}` : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      intent={
                        item.priority === 'urgent'
                          ? 'danger'
                          : item.priority === 'high'
                            ? 'warning'
                            : item.priority === 'medium'
                              ? 'primary'
                              : 'neutral'
                      }
                      size="sm"
                    >
                      {item.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      {item.reportedBy && <span>Reported: {item.reportedBy}</span>}
                      {item.assignedTo ? (
                        <span className="text-muted">Assigned: {item.assignedTo}</span>
                      ) : (
                        <span className="text-warning italic font-medium">Unassigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      intent={
                        item.status === 'resolved' || item.status === 'closed'
                          ? 'success'
                          : item.status === 'in-progress'
                            ? 'warning'
                            : 'info'
                      }
                      size="sm"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu
                      items={[
                        ...(item.status === 'open'
                          ? [
                              {
                                label: 'Start Repair',
                                onClick: () => handleUpdateStatus(item.id, 'in-progress'),
                              },
                            ]
                          : []),
                        ...(item.status === 'in-progress'
                          ? [
                              {
                                label: 'Mark Resolved',
                                onClick: () => handleUpdateStatus(item.id, 'resolved'),
                              },
                            ]
                          : []),
                        {
                          label: 'Edit Ticket',
                          icon: Edit,
                          onClick: () => handleOpenEdit(item),
                        },
                        {
                          label: 'Delete Ticket',
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
        title={editingItem ? 'Edit Ticket' : 'File Maintenance Request'}
        description="Fill property issue specifics and assign repair specialists."
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Ticket</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <Input
            label="Issue Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AC Unit Not Cooling"
            required
          />
          <Input
            label="Property Name"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="e.g. Hassan Villa"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority Level"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
            />
            <Select
              label="Status"
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reported By"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
            />
            <Input
              label="Assignee/Vendor"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Ravi Plumbing Services"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text2">Issue Description</label>
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-focus/30"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the maintenance issue..."
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
