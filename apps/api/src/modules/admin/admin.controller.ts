import type { Request, Response } from 'express'
import { getAuthRepository } from '../auth/repository.js'
import { NotFoundError } from '../../core/errors.js'

const repository = getAuthRepository()

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
