import { Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6">
      <p className="text-gradient text-7xl font-extrabold">404</p>
      <EmptyState
        icon={<Compass className="h-6 w-6" aria-hidden="true" />}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go back
            </Button>
            <Button onClick={() => navigate('/')}>Back to home</Button>
          </div>
        }
        className="bg-transparent"
      />
    </div>
  )
}
