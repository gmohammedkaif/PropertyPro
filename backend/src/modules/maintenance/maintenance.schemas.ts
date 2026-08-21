import { z } from 'zod'

export const maintenanceIdSchema = z.object({
  id: z.string().min(1, 'Maintenance ID is required'),
})

export const createMaintenanceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  propertyName: z.string().trim().optional(),
  category: z.string().trim().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'emergency']).optional(),
  reportedBy: z.string().trim().optional(),
})

export const updateMaintenanceTenantSchema = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: z.string().trim().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent', 'emergency']).optional(),
  })
  .strict()

export const updateMaintenanceOwnerSchema = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    propertyName: z.string().trim().optional(),
    category: z.string().trim().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent', 'emergency']).optional(),
    status: z.enum(['open', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected']).optional(),
    assignedTo: z.string().trim().optional(),
    resolvedAt: z.string().nullable().optional(),
  })
  .strict()

export const PROTECTED_MAINTENANCE_FIELDS = [
  'ownerEmail',
  'ownerId',
  'reportedBy',
  'propertyId',
  'tenantEmail',
  'tenantId',
  '_id',
  'id',
  'createdAt',
  'updatedAt',
]
