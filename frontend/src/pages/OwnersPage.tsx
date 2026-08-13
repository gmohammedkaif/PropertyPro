import { useState } from 'react'
import { Users, Search, Mail, Phone, Home } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useAdminOwners } from '@/hooks/useAdmin'
import { EnhancedInput } from '@/components/ui/EnhancedInput'

export function OwnersPage() {
  const { data: owners = [], isLoading } = useAdminOwners()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-text">Registered House Owners</h1>
        </div>
        <p className="text-sm text-text2 mt-1">
          View all registered house owners on the platform and their published properties counts.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 glass rounded-xl border border-border/50">
        <EnhancedInput
          type="text"
          placeholder="Search by name or email…"
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="w-full sm:w-80"
        />
      </div>

      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <Spinner label="Loading owners list…" />
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <Users className="h-10 w-10 text-muted/40" />
            <p className="text-sm font-semibold text-text">No owners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface2/40 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Phone</th>
                  <th className="py-3.5 px-6">Properties Owned</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-surface2/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-text uppercase shrink-0">
                          {owner.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-text">{owner.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-text2 text-xs font-mono">
                        <Mail className="h-3.5 w-3.5 text-muted" />
                        {owner.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-text2 text-xs">
                        <Phone className="h-3.5 w-3.5 text-muted" />
                        {owner.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-text font-semibold">
                        <Home className="h-4 w-4 text-primary" />
                        {owner.propertyCount} properties
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        owner.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {owner.status}
                      </span>
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
