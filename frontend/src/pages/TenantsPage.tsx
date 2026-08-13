import { useState } from 'react'
import { Users, Search, Mail, Key } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminTenants } from '@/hooks/useAdmin'
import { EnhancedInput } from '@/components/ui/EnhancedInput'

export function TenantsPage() {
  const { data: tenants = [], isLoading } = useAdminTenants()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active-lease' | 'no-lease'>('all')

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active-lease' && t.hasActiveLease) ||
      (filter === 'no-lease' && !t.hasActiveLease)
    return matchesSearch && matchesFilter
  })

  const activeLeaseCount = tenants.filter((t) => t.hasActiveLease).length
  const registeredCount = tenants.length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight text-text">Tenants</h1>
        </div>
        <p className="text-sm text-text2 mt-1">
          Registered tenants on the platform.{' '}
          <span className="text-emerald-400 font-semibold">{activeLeaseCount} active lease{activeLeaseCount !== 1 ? 's' : ''}</span>
          {' '}out of {registeredCount} registered.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 glass rounded-xl border border-border/50">
        <EnhancedInput
          type="text"
          placeholder="Search by name or email…"
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="w-full sm:w-80"
        />
        <div className="flex gap-2">
          {(['all', 'active-lease', 'no-lease'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface2/60 text-text2 border-border/40 hover:bg-surface2'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active-lease' ? 'Active Lease' : 'No Lease'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <Spinner label="Loading tenants list…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <Users className="h-10 w-10 text-muted/40" />
            <p className="text-sm font-semibold text-text">No tenants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface2/40 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6">Lease Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-surface2/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-text uppercase shrink-0">
                          {tenant.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-text">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-text2 text-xs font-mono">
                        <Mail className="h-3.5 w-3.5 text-muted" />
                        {tenant.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        tenant.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tenant.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {tenant.hasActiveLease ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                          <Key className="h-3 w-3" /> Active Tenant
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface2/60 text-muted border border-border/40 w-fit">
                          Registered
                        </span>
                      )}
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
