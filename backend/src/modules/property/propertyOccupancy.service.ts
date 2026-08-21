import { Property } from './models/property.model.js'

let isOccupancySyncRunning = false

export async function syncPropertyOccupancy(propertyIds?: string[]): Promise<void> {
  if (isOccupancySyncRunning) return
  isOccupancySyncRunning = true

  try {
    const { Tenancy } = await import('../tenancy/tenancy.model.js')

    const matchFilter: Record<string, any> = {
      status: { $in: ['active', 'expiring-soon'] },
    }

    if (propertyIds && propertyIds.length > 0) {
      const validIds = propertyIds.filter(Boolean)
      if (validIds.length > 0) {
        matchFilter.propertyId = { $in: validIds }
      }
    }

    // 1. Group active tenancies by propertyId and sum unitsOccupied (default 1)
    const activeTenancyAgg = await Tenancy.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$propertyId',
          totalOccupied: { $sum: { $ifNull: ['$unitsOccupied', 1] } },
        },
      },
    ])

    const propertyOccupancyMap = new Map<string, number>()
    for (const item of activeTenancyAgg) {
      if (item._id) {
        propertyOccupancyMap.set(item._id.toString(), Math.max(0, item.totalOccupied || 0))
      }
    }

    // 2. Query target properties to compare stored vs actual occupied units
    const propertyQuery: Record<string, any> = { deletedAt: null }
    if (propertyIds && propertyIds.length > 0) {
      const validIds = propertyIds.filter(Boolean)
      if (validIds.length > 0) {
        propertyQuery._id = { $in: validIds }
      }
    }

    const properties = await Property.find(propertyQuery, { _id: 1, totalUnits: 1, occupiedUnits: 1, listingStatus: 1 }).lean()

    const bulkOps = []
    for (const prop of properties) {
      const propId = prop._id.toString()
      const realOccupied = Math.min(prop.totalUnits || 1, propertyOccupancyMap.get(propId) ?? 0)

      let nextListingStatus = prop.listingStatus
      if (realOccupied >= (prop.totalUnits || 1) && prop.listingStatus === 'for-rent') {
        nextListingStatus = 'occupied'
      } else if (realOccupied < (prop.totalUnits || 1) && prop.listingStatus === 'occupied') {
        nextListingStatus = 'for-rent'
      }

      if (prop.occupiedUnits !== realOccupied || prop.listingStatus !== nextListingStatus) {
        bulkOps.push({
          updateOne: {
            filter: { _id: prop._id },
            update: { $set: { occupiedUnits: realOccupied, listingStatus: nextListingStatus } },
          },
        })
      }
    }

    if (bulkOps.length > 0) {
      await Property.bulkWrite(bulkOps)
    }
  } catch (err) {
    // Non-blocking sync error catch
  } finally {
    isOccupancySyncRunning = false
  }
}
