import type { PropertyUnit } from '@/shared'

export interface UnitRecord {
  unitNumber: string
  floor?: string
  bedrooms?: number
  bathrooms?: number
  parking?: number
  areaSqFt?: number
  monthlyRent?: number
  securityDeposit?: number
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
  const isResort = type === 'resort'

  if (isHouse) {
    return Array.from({ length: count }, (_, i) => {
      if (i < ORDINAL_FLOORS.length) return ORDINAL_FLOORS[i]
      return `Floor ${i}`
    })
  }

  if (isResort) {
    return Array.from({ length: count }, (_, i) => {
      const roomNum = 101 + i
      return `Room ${roomNum}`
    })
  }

  // Apartment (default)
  return Array.from({ length: count }, (_, i) => {
    const unitNum = 101 + i
    return `A-${unitNum}`
  })
}

/**
 * Derives real-time unit occupancy records by cross-referencing generated or stored property units
 * with active tenancy records from MongoDB.
 */
export function derivePropertyUnits(
  property: {
    id: string
    type: string
    totalUnits?: number
    bedrooms?: number
    bathrooms?: number
    parking?: number
    areaSqFt?: number
    monthlyRent?: number
    securityDeposit?: number
    units?: PropertyUnit[]
  },
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
  const totalUnitsCount = property.totalUnits || (property.units && property.units.length) || 1
  const activeTenancies = tenancies.filter(
    (t) =>
      t.propertyId === property.id &&
      (t.status === 'active' || t.status === 'expiring-soon')
  )

  // If property has stored individual units, use them
  if (property.units && property.units.length > 0) {
    return property.units.map((unit, idx) => {
      const matchedTenancy = activeTenancies.find(
        (t) => (t.unitNumber || 'Main').toLowerCase() === unit.unitNumber.toLowerCase()
      )

      const isHouse = property.type === 'house' || property.type === 'villa'
      const defaultFloor = isHouse ? unit.unitNumber : `Floor ${Math.floor(idx / 4) + 1}`

      if (matchedTenancy) {
        return {
          unitNumber: unit.unitNumber,
          floor: unit.floor || defaultFloor,
          bedrooms: unit.bedrooms ?? property.bedrooms,
          bathrooms: unit.bathrooms ?? property.bathrooms,
          parking: unit.parking ?? property.parking,
          areaSqFt: unit.areaSqFt ?? property.areaSqFt,
          monthlyRent: unit.monthlyRent ?? property.monthlyRent,
          securityDeposit: unit.securityDeposit ?? property.securityDeposit,
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
        unitNumber: unit.unitNumber,
        floor: unit.floor || defaultFloor,
        bedrooms: unit.bedrooms ?? property.bedrooms,
        bathrooms: unit.bathrooms ?? property.bathrooms,
        parking: unit.parking ?? property.parking,
        areaSqFt: unit.areaSqFt ?? property.areaSqFt,
        monthlyRent: unit.monthlyRent ?? property.monthlyRent,
        securityDeposit: unit.securityDeposit ?? property.securityDeposit,
        status: 'AVAILABLE',
      }
    })
  }

  // Fallback for existing properties without stored individual unit specs
  const unitNames = generatePropertyUnitNames(property.type, totalUnitsCount)

  return unitNames.map((unitNumber, idx) => {
    const isHouse = property.type === 'house' || property.type === 'villa'
    const floorLabel = isHouse ? unitNumber : `Floor ${Math.floor(idx / 4) + 1}`

    const matchedTenancy = activeTenancies.find(
      (t) => (t.unitNumber || 'Main').toLowerCase() === unitNumber.toLowerCase()
    )

    if (matchedTenancy) {
      return {
        unitNumber,
        floor: floorLabel,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking: property.parking,
        areaSqFt: property.areaSqFt,
        monthlyRent: property.monthlyRent,
        securityDeposit: property.securityDeposit,
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
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parking: property.parking,
      areaSqFt: property.areaSqFt,
      monthlyRent: property.monthlyRent,
      securityDeposit: property.securityDeposit,
      status: 'AVAILABLE',
    }
  })
}
