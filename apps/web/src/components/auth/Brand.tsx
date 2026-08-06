import { Home } from 'lucide-react'

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md">
        <Home className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-text">
        Property<span className="text-primary">Pro</span>
      </span>
    </div>
  )
}