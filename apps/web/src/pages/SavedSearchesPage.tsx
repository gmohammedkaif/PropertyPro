import { useState } from 'react'
import {
  Heart,
  Trash2,
  ArrowRight,
  Bell,
  BellOff,
} from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'

interface SavedSearch {
  id: string
  title: string
  filters: {
    type?: string
    city?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
  }
  alertsEnabled: boolean
  createdAt: string
}

const INITIAL_SEARCHES: SavedSearch[] = [
  {
    id: 'sv_1',
    title: '3BHK Apartments in Bangalore',
    filters: {
      type: 'Apartment',
      city: 'Bangalore',
      bedrooms: 3,
      maxPrice: 60000,
    },
    alertsEnabled: true,
    createdAt: '2026-07-28',
  },
  {
    id: 'sv_2',
    title: 'Commercial Offices under 10L',
    filters: {
      type: 'Commercial',
      minPrice: 200000,
      maxPrice: 1000000,
    },
    alertsEnabled: false,
    createdAt: '2026-07-15',
  },
  {
    id: 'sv_3',
    title: 'Villas in Sunset Residences',
    filters: {
      type: 'House',
      city: 'Mumbai',
    },
    alertsEnabled: true,
    createdAt: '2026-08-01',
  },
]

export function SavedSearchesPage() {
  const toast = useToast()
  const [searches, setSearches] = useState<SavedSearch[]>(INITIAL_SEARCHES)

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Remove saved search "${title}"?`)) {
      setSearches((prev) => prev.filter((s) => s.id !== id))
      toast.success('Saved search removed successfully')
    }
  }

  const toggleAlerts = (id: string) => {
    setSearches((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextVal = !s.alertsEnabled
          toast.success(
            nextVal
              ? 'Instant alerts enabled for this query'
              : 'Alerts disabled for this query',
          )
          return { ...s, alertsEnabled: nextVal }
        }
        return s
      }),
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-text">Saved Searches</h1>
        <p className="text-sm text-muted">Keep track of your matching filters and toggle instant mailing alerts.</p>
      </div>

      {searches.length === 0 ? (
        <Card className="p-12 text-center text-muted">
          <Heart className="h-8 w-8 mx-auto text-muted/50 mb-3" />
          No saved searches found. Save your custom search filters from the Browse tab to display them here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {searches.map((item) => (
            <Card key={item.id} className="p-5 hover:border-primary/30 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Search Info & Badges */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Heart className="h-4 w-4 fill-current" />
                    </span>
                    <h3 className="font-bold text-text text-sm sm:text-base">{item.title}</h3>
                  </div>

                  {/* Render filters chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.filters.type && (
                      <Badge intent="primary" size="sm">
                        Type: {item.filters.type}
                      </Badge>
                    )}
                    {item.filters.city && (
                      <Badge intent="success" size="sm">
                        City: {item.filters.city}
                      </Badge>
                    )}
                    {item.filters.bedrooms && (
                      <Badge intent="neutral" size="sm">
                        {item.filters.bedrooms} BHK
                      </Badge>
                    )}
                    {item.filters.maxPrice && (
                      <Badge intent="info" size="sm">
                        Price Max: {item.filters.maxPrice / 1000}k
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted">Saved on {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 sm:self-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleAlerts(item.id)}
                    title={item.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                  >
                    {item.alertsEnabled ? (
                      <>
                        <Bell className="h-3.5 w-3.5 text-success" />
                        Alerts On
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3.5 w-3.5 text-muted" />
                        Alerts Off
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" size="sm">
                    Run
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-danger hover:bg-danger-soft/20"
                    onClick={() => handleDelete(item.id, item.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
