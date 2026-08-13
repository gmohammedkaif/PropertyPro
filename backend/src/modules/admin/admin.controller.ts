import type { Request, Response } from 'express'
import { getAuthRepository } from '../auth/repository.js'
import { getPropertyRepository } from '../property/repository.js'
import { NotFoundError } from '../../core/errors.js'
import { Tenancy } from '../tenancy/tenancy.model.js'

export async function listOwnerRequests(_req: Request, res: Response): Promise<void> {
  const repo = getAuthRepository()
  const requests = await repo.listOwnerRequests()
  res.json({
    data: requests.map((r) => ({
      id: r.id,
      email: r.email,
      name: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email,
      roles: r.roles,
      status: r.status,
      createdAt: r.createdAt,
    })),
    meta: { total: requests.length },
    error: null,
  })
}

export async function approveOwnerRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const repo = getAuthRepository()
  const updated = await repo.updateUserStatus(id, 'active')
  if (!updated) throw new NotFoundError('Owner request not found')

  res.json({
    data: {
      id: updated.id,
      email: updated.email,
      status: updated.status,
      message: 'Owner account approved successfully.',
    },
    meta: {},
    error: null,
  })
}

export async function rejectOwnerRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const repo = getAuthRepository()
  const updated = await repo.updateUserStatus(id, 'rejected')
  if (!updated) throw new NotFoundError('Owner request not found')

  res.json({
    data: {
      id: updated.id,
      email: updated.email,
      status: updated.status,
      message: 'Owner account rejected.',
    },
    meta: {},
    error: null,
  })
}

export async function listAdminStats(req: Request, res: Response): Promise<void> {
  const authRepo = getAuthRepository()
  const propRepo = getPropertyRepository()

  const [users, properties, activeTenancyCount, totalTenancyCount] = await Promise.all([
    authRepo.listAllUsers(),
    propRepo.listAllProperties(),
    Tenancy.countDocuments({ status: { $in: ['active', 'expiring-soon'] } }),
    Tenancy.countDocuments({ status: { $ne: 'terminated' } }),
  ])

  const totalOwners = users.filter((u) => u.roles.includes('owner') && u.status === 'active').length
  const totalTenants = users.filter((u) => u.roles.includes('tenant') && u.status === 'active').length

  const totalProperties = properties.length
  // A property is rented if it has an active tenancy (most reliable source of truth)
  // We cross-reference listingStatus as a secondary signal
  const rentedProperties = properties.filter(
    (p) => p.listingStatus === 'occupied' || (p.occupiedUnits != null && p.occupiedUnits > 0)
  ).length
  const availableProperties = properties.filter(
    (p) => (p.listingStatus === 'for-rent' || p.listingStatus === 'for-sale') &&
            (p.totalUnits == null || p.totalUnits === 0 || (p.occupiedUnits ?? 0) < (p.totalUnits ?? 0))
  ).length
  const propertiesForSale = properties.filter((p) => p.listingStatus === 'for-sale').length

  res.json({
    data: {
      totalProperties,
      rentedProperties,
      availableProperties,
      propertiesForSale,
      totalOwners,
      totalTenants,
      activeTenants: activeTenancyCount,
      totalLeases: totalTenancyCount,
    },
    meta: {},
    error: null,
  })
}

export async function listOwners(req: Request, res: Response): Promise<void> {
  const authRepo = getAuthRepository()
  const propRepo = getPropertyRepository()

  const [users, properties] = await Promise.all([
    authRepo.listAllUsers(),
    propRepo.listAllProperties(),
  ])

  const owners = users.filter((u) => u.roles.includes('owner'))

  res.json({
    data: owners.map((o) => {
      const ownerProps = properties.filter(
        (p) => p.ownerId === o.id || p.ownerEmail?.toLowerCase() === o.email.toLowerCase()
      )
      return {
        id: o.id,
        name: [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email,
        email: o.email,
        phone: o.phone || 'N/A',
        propertyCount: ownerProps.length,
        status: o.status,
      }
    }),
    meta: {},
    error: null,
  })
}

export async function listTenants(req: Request, res: Response): Promise<void> {
  const authRepo = getAuthRepository()
  const users = await authRepo.listAllUsers()
  const tenants = users.filter((u) => u.roles.includes('tenant'))

  // Fetch active tenancy emails to mark which tenants are currently active
  const activeTenancies = await Tenancy.find(
    { status: { $in: ['active', 'expiring-soon'] } },
    { tenantEmail: 1 }
  ).lean()
  const activeTenantEmails = new Set(activeTenancies.map((t: any) => t.tenantEmail?.toLowerCase()))

  res.json({
    data: tenants.map((t) => ({
      id: t.id,
      name: [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email,
      email: t.email,
      status: t.status,
      hasActiveLease: activeTenantEmails.has(t.email.toLowerCase()),
    })),
    meta: {},
    error: null,
  })
}
