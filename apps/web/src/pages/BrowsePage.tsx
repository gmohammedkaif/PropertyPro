import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

export function BrowsePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Search className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-text">Listing discovery</h1>
        <p className="mx-auto max-w-md text-sm text-muted">
          Search, filter, and map-based browsing lands in Phase P1 together with the listing module.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge intent="primary" dot>
          Phase P1
        </Badge>
        <Spinner size={16} label="Loading placeholder" />
      </div>
    </div>
  )
}
