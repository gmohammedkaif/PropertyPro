import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, UserCheck, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EnhancedButton } from '@/components/ui/EnhancedButton'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { useOwnerRequests, useApproveOwner, useRejectOwner, type OwnerRequest } from '@/hooks/useAdmin'

export function OwnerRequestsPage() {
  const { data: ownerRequests = [], isLoading } = useOwnerRequests()
  const approveOwner = useApproveOwner()
  const rejectOwner = useRejectOwner()
  const toast = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleApproveOwnerReg = (req: OwnerRequest) => {
    approveOwner.mutate(req.id, {
      onSuccess: () => {
        toast.success(`Approved owner account for ${req.name}`)
      },
      onError: () => {
        toast.error('Failed to approve owner account.')
      },
    })
  }

  const handleRejectOwnerReg = (req: OwnerRequest) => {
    rejectOwner.mutate(req.id, {
      onSuccess: () => {
        toast.success(`Rejected owner request for ${req.name}`)
      },
      onError: () => {
        toast.error('Failed to reject owner request.')
      },
    })
  }

  const filteredOwnerRegs = ownerRequests.filter((req) => {
    const matchesSearch =
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <UserCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-text">Owner Registration Requests</h1>
        </div>
        <p className="text-sm text-text2 mt-1">
          Review and approve or reject House Owner account registration requests submitted to the platform.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 glass rounded-xl border border-border/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email…"
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filterStatus === statusKey
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface2/50 text-text2 hover:text-text hover:bg-surface2'
              }`}
            >
              {statusKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <Spinner label="Loading owner requests…" />
          </div>
        ) : filteredOwnerRegs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <UserCheck className="h-10 w-10 text-muted/40" />
            <p className="text-sm font-semibold text-text">No owner registration requests found</p>
            <p className="text-xs text-muted max-w-sm">
              When new House Owners register on the platform, their accounts require Super Admin approval before activation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface2/40 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Registration Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOwnerRegs.map((req) => (
                  <tr key={req.id} className="hover:bg-surface2/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-text uppercase shrink-0">
                          {req.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-text">{req.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-text2 font-mono text-xs">{req.email}</td>
                    <td className="py-4 px-6 text-text2 text-xs">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        intent={req.status === 'active' ? 'success' : req.status === 'pending_approval' ? 'warning' : 'danger'}
                        size="sm"
                        className="capitalize font-semibold"
                      >
                        {req.status === 'pending_approval' ? (
                          <><Clock className="h-3 w-3" /> Pending Approval</>
                        ) : req.status === 'active' ? (
                          <><CheckCircle2 className="h-3 w-3" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3" /> Rejected</>
                        )}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status !== 'active' && (
                          <EnhancedButton
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveOwnerReg(req)}
                            loading={approveOwner.isPending}
                          >
                            Approve
                          </EnhancedButton>
                        )}
                        {req.status !== 'rejected' && (
                          <EnhancedButton
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectOwnerReg(req)}
                            loading={rejectOwner.isPending}
                          >
                            Reject
                          </EnhancedButton>
                        )}
                        {req.status === 'rejected' && (
                          <span className="text-xs text-muted italic">Rejected</span>
                        )}
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
