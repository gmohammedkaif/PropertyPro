import { useParams, useNavigate } from 'react-router-dom'

import { Layers } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

function humanize(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function PlaceholderPage() {
  const { feature } = useParams()
  const navigate = useNavigate()
  const title = feature ? humanize(feature) : 'Coming soon'

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={<Layers className="h-6 w-6" aria-hidden="true" />}
        title={`${title} is on the way`}
        description={`This is a planned PropertyPro module. It ships in an upcoming Phase milestone — the foundation is ready for it.`}
        action={
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
        }
      />
    </div>
  )
}
