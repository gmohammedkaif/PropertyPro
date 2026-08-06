import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, UserCheck, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { useOwnerRequests, useApproveOwner, useRejectOwner, type OwnerRequest } from '@/hooks/useAdmin'

export function OwnerRequestsPage() {
  const { data: requests = [], isLoading } = useOwnerRequests()
  const approveOwner = useApproveOwner()
  const rejectOwner = useRejectOwner()
  const toast = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleApprove = (req: OwnerRequest) => {
    approveOwner.mutate(req.id, {
      onSuccess: () => {
        toast.success(`Approved owner account for ${req.name}`)
      },
      onError: () => {
        toast.error('Failed to approve owner account.')
      },
    })
  }

  const handleReject = (req: OwnerRequest) => {
    rejectOwner.mutate(req.id, {
      onSuccess: () => {
        toast.success(`Rejected owner request for ${req.name}`)
      },
      onError: () => {
        toast.error('Failed to reject owner request.')
      },
    })
  }

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const pendingCount = requests.filter((r) => r.status === 'pending_approval').length

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Owner Requests</h1>
            {pendingCount > 0 ? (
              <Badge intent="warning" size="md" className="font-semibold">
                {pendingCount} Pending
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-text2 mt-1">
            Review and manage House Owner registration approval requests.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 glass rounded-xl border border-border/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by username or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface2/60 border border-border/40 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'pending_approval', 'active', 'rejected'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all duration-200 ${
                filterStatus === statusKey
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface2/50 text-text2 hover:text-text hover:bg-surface2'
              }`}
            >
              {statusKey === 'pending_approval' ? 'Pending' : statusKey}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <Spinner label="Loading owner requests…" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <UserCheck className="h-10 w-10 text-muted" aria-hidden="true" />
            <p className="text-sm font-semibold text-text">No owner requests found</p>
            <p className="text-xs text-muted max-w-sm">
              There are currently no House Owner registration requests matching your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface2/40 text-xs font-semibold uppercase tracking-wider text-muted select-none">
                  <th className="py-3.5 px-6">Username / Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Registration Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface2/30 transition-colors duration-150 group">
                    <td className="py-4 px-6 font-semibold text-text">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {req.name.slice(0, 2)}
                        </div>
                        <span className="truncate">{req.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-text2 font-mono text-xs">{req.email}</td>
                    <td className="py-4 px-6 text-text2 text-xs">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      {req.status === 'pending_approval' ? (
                        <Badge intent="warning" size="sm" className="gap-1 font-semibold">
                          <Clock className="h-3 w-3" />
                          Pending Approval
                        </Badge>
                      ) : req.status === 'active' ? (
                        <Badge intent="success" size="sm" className="gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge intent="danger" size="sm" className="gap-1 font-semibold">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status !== 'active' ? (
                          <EnhancedButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(req)}
                            loading={approveOwner.isPending}
                            className="h-8 px-3 text-xs font-semibold"
                          >
                            Approve
                          </EnhancedButton>
                        ) : null}

                        {req.status !== 'rejected' ? (
                          <EnhancedButton
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(req)}
                            loading={rejectOwner.isPending}
                            className="h-8 px-3 text-xs font-semibold"
                          >
                            Reject
                          </EnhancedButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
