export interface UnitRecord {
  unitNumber: string
  floor?: string
  status: 'AVAILABLE' | 'OCCUPIED'
  tenantName?: string
  tenantEmail?: string
  tenantPhone?: string
  tenancyId?: string
  leaseStart?: string
  leaseEnd?: string
}

const ORDINAL_FLOORS = [
  'Ground Floor',
  'First Floor',
  'Second Floor',
  'Third Floor',
  'Fourth Floor',
  'Fifth Floor',
  'Sixth Floor',
  'Seventh Floor',
  'Eighth Floor',
  'Ninth Floor',
  'Tenth Floor',
]

/**
 * Generates deterministic unit identifiers based on property type and total units count.
 */
export function generatePropertyUnitNames(type: string, totalUnits: number): string[] {
  const count = Math.max(1, totalUnits || 1)
  const isHouse = type === 'house' || type === 'villa'

  if (isHouse) {
    return Array.from({ length: count }, (_, i) => {
      if (i < ORDINAL_FLOORS.length) return ORDINAL_FLOORS[i]
      return `Floor ${i}`
    })
  }

  // Apartment, Commercial, Mixed
  return Array.from({ length: count }, (_, i) => {
    const unitNum = 101 + i
    return `A-${unitNum}`
  })
}

/**
 * Derives real-time unit occupancy records by cross-referencing generated property units
 * with active tenancy records from MongoDB.
 */
export function derivePropertyUnits(
  property: { id: string; type: string; totalUnits: number },
  tenancies: Array<{
    id: string
    propertyId: string
    propertyName?: string
    unitNumber?: string
    status: string
    tenantName: string
    tenantEmail: string
    tenantPhone?: string
    leaseStart: string
    leaseEnd: string
  }>
): UnitRecord[] {
  const unitNames = generatePropertyUnitNames(property.type, property.totalUnits)

  // Find all active/expiring-soon tenancies for this property
  const activeTenancies = tenancies.filter(
    (t) =>
      t.propertyId === property.id &&
      (t.status === 'active' || t.status === 'expiring-soon')
  )

  return unitNames.map((unitNumber, idx) => {
    const isHouse = property.type === 'house' || property.type === 'villa'
    const floorLabel = isHouse ? unitNumber : `Floor ${Math.floor(idx / 4) + 1}`

    // Match tenancy by unitNumber
    const matchedTenancy = activeTenancies.find(
      (t) => (t.unitNumber || 'Main').toLowerCase() === unitNumber.toLowerCase()
    )

    if (matchedTenancy) {
      return {
        unitNumber,
        floor: floorLabel,
        status: 'OCCUPIED',
        tenantName: matchedTenancy.tenantName,
        tenantEmail: matchedTenancy.tenantEmail,
        tenantPhone: matchedTenancy.tenantPhone,
        tenancyId: matchedTenancy.id,
        leaseStart: matchedTenancy.leaseStart,
        leaseEnd: matchedTenancy.leaseEnd,
      }
    }

    return {
      unitNumber,
      floor: floorLabel,
      status: 'AVAILABLE',
    }
  })
}
