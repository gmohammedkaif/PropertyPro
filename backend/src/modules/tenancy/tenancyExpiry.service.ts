import { Tenancy } from './tenancy.model.js'
import { Property } from '../property/models/property.model.js'
import { createNotificationIdempotent } from '../notification/notification.model.js'
import { syncPropertyOccupancy } from '../property/propertyOccupancy.service.js'

let isSweeperRunning = false

export async function expireTenancy(tenancyId: string): Promise<boolean> {
  const tenancy = await Tenancy.findById(tenancyId)
  if (!tenancy) return false

  // Idempotent safeguard: only transition if status is currently active or expiring-soon
  if (tenancy.status !== 'active' && tenancy.status !== 'expiring-soon') {
    return false
  }

  tenancy.status = 'expired'
  await tenancy.save()

  // Synchronize real property occupancy from active tenancies
  if (tenancy.propertyId) {
    await syncPropertyOccupancy([tenancy.propertyId])
  }

  // Generate idempotent notifications for Tenant and Owner
  const tenancyIdStr = tenancy._id.toString()

  if (tenancy.tenantEmail) {
    await createNotificationIdempotent({
      userEmail: tenancy.tenantEmail,
      title: 'Lease Expired 📅',
      message: `Your tenancy lease for ${tenancy.propertyName} has reached its end date and expired.`,
      type: 'info',
      eventType: 'LEASE_EXPIRED',
      relatedEntityId: tenancyIdStr,
    })
  }

  if (tenancy.ownerEmail) {
    await createNotificationIdempotent({
      userEmail: tenancy.ownerEmail,
      title: 'Lease Expired 📅',
      message: `The tenancy lease for ${tenancy.propertyName} (${tenancy.tenantName}) has reached its end date and expired.`,
      type: 'info',
      eventType: 'LEASE_EXPIRED',
      relatedEntityId: tenancyIdStr,
    })
  }

  return true
}

export async function sweepLeaseExpiries(): Promise<{ expiredCount: number; warnedCount: number }> {
  if (isSweeperRunning) return { expiredCount: 0, warnedCount: 0 }
  isSweeperRunning = true

  let expiredCount = 0
  let warnedCount = 0

  try {
    const now = new Date()

    // 1. Find tenancies past leaseEnd and expire them
    const expiredTenancies = await Tenancy.find({
      status: { $in: ['active', 'expiring-soon'] },
      leaseEnd: { $lte: now },
    }).lean()

    for (const t of expiredTenancies) {
      const success = await expireTenancy(t._id.toString())
      if (success) expiredCount++
    }

    // 2. Find active tenancies expiring within 30 days and mark as expiring-soon / send warnings
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const expiringSoonTenancies = await Tenancy.find({
      status: { $in: ['active', 'expiring-soon'] },
      leaseEnd: { $gt: now, $lte: thirtyDaysFromNow },
    })

    for (const tenancy of expiringSoonTenancies) {
      if (tenancy.status === 'active') {
        tenancy.status = 'expiring-soon'
        await tenancy.save()
      }

      const tenancyIdStr = tenancy._id.toString()

      // 30-day warning notification
      if (tenancy.tenantEmail) {
        await createNotificationIdempotent({
          userEmail: tenancy.tenantEmail,
          title: 'Lease Expiring Soon ⏳',
          message: `Your lease for ${tenancy.propertyName} is expiring soon on ${new Date(tenancy.leaseEnd).toLocaleDateString()}.`,
          type: 'warning',
          eventType: 'LEASE_EXPIRING_30D',
          relatedEntityId: tenancyIdStr,
        })
      }
      if (tenancy.ownerEmail) {
        await createNotificationIdempotent({
          userEmail: tenancy.ownerEmail,
          title: 'Lease Expiring Soon ⏳',
          message: `The lease for ${tenancy.propertyName} (${tenancy.tenantName}) is expiring soon on ${new Date(tenancy.leaseEnd).toLocaleDateString()}.`,
          type: 'warning',
          eventType: 'LEASE_EXPIRING_30D',
          relatedEntityId: tenancyIdStr,
        })
      }

      // 7-day urgent warning notification
      if (new Date(tenancy.leaseEnd) <= sevenDaysFromNow) {
        if (tenancy.tenantEmail) {
          await createNotificationIdempotent({
            userEmail: tenancy.tenantEmail,
            title: 'Lease Expiring in 7 Days ⚠️',
            message: `Urgent: Your lease for ${tenancy.propertyName} will expire in 7 days.`,
            type: 'danger',
            eventType: 'LEASE_EXPIRING_7D',
            relatedEntityId: tenancyIdStr,
          })
        }
        if (tenancy.ownerEmail) {
          await createNotificationIdempotent({
            userEmail: tenancy.ownerEmail,
            title: 'Lease Expiring in 7 Days ⚠️',
            message: `Urgent: The lease for ${tenancy.propertyName} (${tenancy.tenantName}) will expire in 7 days.`,
            type: 'danger',
            eventType: 'LEASE_EXPIRING_7D',
            relatedEntityId: tenancyIdStr,
          })
        }
      }

      warnedCount++
    }
  } finally {
    isSweeperRunning = false
  }

  return { expiredCount, warnedCount }
}
