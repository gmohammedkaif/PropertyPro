import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Wrench,
  AlertOctagon,
  Hammer,
  ClipboardCheck,
  XCircle,
  UserCheck,
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
import { useAuthStore } from '@/stores/authStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useConfirmStore } from '@/stores/confirmStore'
import { useNotificationsStore } from '@/stores/notificationsStore'

// Status labels & visual mapping helper
const STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; intent: 'primary' | 'warning' | 'success' | 'neutral' | 'danger' }
> = {
  open: { label: 'Pending', intent: 'warning' },
  assigned: { label: 'Assigned', intent: 'primary' },
  'in-progress': { label: 'In Progress', intent: 'warning' },
  resolved: { label: 'Completed', intent: 'success' },
  closed: { label: 'Closed', intent: 'neutral' },
  rejected: { label: 'Rejected', intent: 'danger' },
}

export function MaintenancePage() {
  const user = useAuthStore((state) => state.user)
  const toast = useToast()
  const { items: allMaintenance, add, update, remove, fetch: fetchMaintenance } = useMaintenanceStore()
  const { items: properties } = useLocalPropertiesStore()
  const { addNotification } = useNotificationsStore()

  useEffect(() => {
    fetchMaintenance()
  }, [fetchMaintenance])

  const userEmail = user?.email?.toLowerCase() ?? ''
  const userId = user?.id ?? ''
  const userName = user?.name?.toLowerCase() ?? ''
  const isSuperAdmin = user?.roles.includes('admin') || userEmail === 'admin@propertypro.com'
  const isOwner = user?.roles.includes('owner') || user?.roles.includes('agent')

  const myOwnerProperties = properties.filter(
    (p) => p.ownerEmail?.toLowerCase() === userEmail || p.ownerId === userId,
  )
  const myPropertyIds = new Set(myOwnerProperties.map((p) => p.id))
  const myPropertyNames = new Set(myOwnerProperties.map((p) => p.name.toLowerCase()))

  const items = isSuperAdmin
    ? allMaintenance
    : isOwner
    ? allMaintenance.filter(
        (m) =>
          (m.propertyId && myPropertyIds.has(m.propertyId)) ||
          myPropertyNames.has(m.propertyName.toLowerCase()),
      )
    : allMaintenance.filter(
        (m) =>
          m.tenantEmail?.toLowerCase() === userEmail ||
          m.reportedBy?.toLowerCase() === userName,
      )

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
  const [category, setCategory] = useState('Other')
  const [priority, setPriority] = useState<MaintenancePriority>('medium')
  const [status, setStatus] = useState<MaintenanceStatus>('open')
  const [reportedBy, setReportedBy] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const handleOpenAdd = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPropertyName('')
    setCategory('Other')
    setPriority('medium')
    setStatus('open')
    setReportedBy('')
    setTenantEmail('')
    setAssignedTo('')
    setModalOpen(true)
  }

  const handleOpenEdit = (item: MaintenanceRecord) => {
    setEditingItem(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setPropertyName(item.propertyName)
    setCategory(item.category ?? 'Other')
    setPriority(item.priority)
    setStatus(item.status)
    setReportedBy(item.reportedBy ?? '')
    setTenantEmail(item.tenantEmail ?? '')
    setAssignedTo(item.assignedTo ?? '')
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await useConfirmStore.getState().showConfirm({
      title: 'Delete Ticket',
      message: 'Are you sure you want to delete this maintenance request ticket?',
    })
    if (confirmed) {
      try {
        await remove(id)
        toast.success('Ticket deleted successfully')
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete ticket')
      }
    }
  }

  const handleNotifyTenant = (propertyName: string, issueTitle: string, email: string, newStatus: MaintenanceStatus) => {
    if (!email) return
    const statusLabel = STATUS_CONFIG[newStatus]?.label ?? newStatus
    addNotification({
      userEmail: email,
      title: `🛠️ Maintenance Request Status Update`,
      message: `Your request "${issueTitle}" for property ${propertyName} has been updated to "${statusLabel}".`,
      type: newStatus === 'resolved' ? 'success' : newStatus === 'rejected' ? 'danger' : 'info',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !propertyName.trim()) {
      toast.error('Ticket title and property name are required')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      propertyName: propertyName.trim(),
      category: category.trim(),
      priority,
      status,
      reportedBy: reportedBy.trim() || undefined,
      tenantEmail: tenantEmail.trim() || undefined,
      assignedTo: assignedTo.trim() || undefined,
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : undefined,
    }

    try {
      if (editingItem) {
        const oldStatus = editingItem.status
        await update(editingItem.id, payload)
        if (oldStatus !== status && payload.tenantEmail) {
          handleNotifyTenant(payload.propertyName, payload.title, payload.tenantEmail, status)
        }
        toast.success('Ticket updated successfully')
      } else {
        await add(payload)
        if (payload.tenantEmail) {
          handleNotifyTenant(payload.propertyName, payload.title, payload.tenantEmail, status)
        }
        toast.success('Maintenance ticket filed')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save maintenance ticket')
    }
  }

  const handleUpdateStatus = async (item: MaintenanceRecord, newStatus: MaintenanceStatus) => {
    try {
      await update(item.id, {
        status: newStatus,
        resolvedAt: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : undefined,
      })
      if (item.tenantEmail) {
        handleNotifyTenant(item.propertyName, item.title, item.tenantEmail, newStatus)
      }
      toast.success(`Ticket status marked as ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  // Filters
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      (item.category ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  // Stats
  const urgentTickets = items.filter((item) => item.priority === 'urgent' && item.status !== 'closed' && item.status !== 'resolved').length
  const openTickets = items.filter((item) => item.status === 'open').length
  const inProgressTickets = items.filter((item) => item.status === 'in-progress').length
  const resolvedTickets = items.filter((item) => item.status === 'resolved' || item.status === 'closed').length

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
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
            placeholder="Search issue, category, or property..."
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
              { value: 'open', label: 'Pending' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'resolved', label: 'Completed' },
              { value: 'closed', label: 'Closed' },
              { value: 'rejected', label: 'Rejected' },
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
              <TableHead>Category</TableHead>
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
                <TableCell colSpan={7} className="h-32 text-center text-muted">
                  No maintenance requests logged. File a request to populate this list.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col max-w-sm">
                      <span className="font-semibold text-text">{item.title}</span>
                      <span className="text-xs text-muted truncate">
                        {item.propertyName} {item.description ? `• ${item.description}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface2 text-text">
                      {item.category ?? 'Other'}
                    </span>
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
                      {item.tenantEmail && <span className="text-[10px] text-muted font-mono">{item.tenantEmail}</span>}
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
                      intent={STATUS_CONFIG[item.status]?.intent ?? 'neutral'}
                      size="sm"
                    >
                      {STATUS_CONFIG[item.status]?.label.toUpperCase() ?? item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu
                      items={[
                        ...(item.status === 'open'
                          ? [
                              {
                                label: 'Mark Assigned',
                                icon: UserCheck,
                                onClick: () => handleUpdateStatus(item, 'assigned'),
                              },
                              {
                                label: 'Start Repair',
                                icon: Hammer,
                                onClick: () => handleUpdateStatus(item, 'in-progress'),
                              },
                              {
                                label: 'Reject Request',
                                icon: XCircle,
                                destructive: true,
                                onClick: () => handleUpdateStatus(item, 'rejected'),
                              },
                            ]
                          : []),
                        ...(item.status === 'assigned'
                          ? [
                              {
                                label: 'Start Repair',
                                icon: Hammer,
                                onClick: () => handleUpdateStatus(item, 'in-progress'),
                              },
                              {
                                label: 'Reject Request',
                                icon: XCircle,
                                destructive: true,
                                onClick: () => handleUpdateStatus(item, 'rejected'),
                              },
                            ]
                          : []),
                        ...(item.status === 'in-progress'
                          ? [
                              {
                                label: 'Mark Completed',
                                icon: ClipboardCheck,
                                onClick: () => handleUpdateStatus(item, 'resolved'),
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
              label="Issue Category"
              options={[
                { value: 'Electrical', label: 'Electrical' },
                { value: 'Water', label: 'Water / Plumbing' },
                { value: 'Cleaning', label: 'Cleaning' },
                { value: 'Internet', label: 'Internet / Wifi' },
                { value: 'Painting', label: 'Painting' },
                { value: 'Security', label: 'Security' },
                { value: 'Other', label: 'Other' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'open', label: 'Pending' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'resolved', label: 'Completed' },
                { value: 'closed', label: 'Closed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
            />
            <Input
              label="Reporter Name"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tenant Email (for notifications)"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              placeholder="e.g. tenant@domain.com"
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
              className="glass-input w-full resize-none min-h-[100px]"
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
