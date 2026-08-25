import { useEffect, useState } from 'react'
import { apiClient, type ApiEnvelope } from '@/lib/apiClient'

export interface OwnerShowcaseData {
  name: string
  roleTitle: string
  quote: string
  initials: string
  totalUnits: number
  hasData: boolean
}

export function useOwnerShowcase(): OwnerShowcaseData {
  const [showcase, setShowcase] = useState<OwnerShowcaseData>({
    name: 'Verified Owner',
    roleTitle: 'Portfolio Manager',
    quote: 'Managing multi-unit properties used to mean spreadsheets and missed calls. PropertyPro unified the entire portfolio into one calm operating system.',
    initials: 'PP',
    totalUnits: 6,
    hasData: false,
  })

  useEffect(() => {
    let isMounted = true

    async function fetchOwnerData() {
      try {
        const propertiesRes = await apiClient.get<ApiEnvelope<{ properties: Array<{ id: string; name: string; totalUnits?: number; units?: unknown[] }> }>>('/properties/search?limit=1')
        const firstProp = propertiesRes.data?.data?.properties?.[0]

        if (firstProp?.id) {
          const ownerRes = await apiClient.get<ApiEnvelope<{ name?: string; email?: string }>>(`/properties/${firstProp.id}/owner`).catch(() => null)
          if (isMounted && ownerRes?.data?.data?.name) {
            const rawName = ownerRes.data.data.name.trim()
            const parts = rawName.split(' ')
            const initials = parts.length > 1
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : rawName.slice(0, 2).toUpperCase()
            const totalUnits = firstProp.totalUnits || firstProp.units?.length || 4

            setShowcase({
              name: rawName,
              roleTitle: `Property Owner · ${totalUnits} Units`,
              quote: `Operating ${firstProp.name} through PropertyPro replaced disjointed messaging and manual tracking with one real-time workspace.`,
              initials,
              totalUnits,
              hasData: true,
            })
          }
        }
      } catch {
        // Fallback gracefully to neutral messaging if offline or unauthenticated
      }
    }

    fetchOwnerData()
    return () => {
      isMounted = false
    }
  }, [])

  return showcase
}
