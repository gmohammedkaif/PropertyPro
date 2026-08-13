import { Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  createMaintenanceTicket,
  listMaintenanceTickets,
  updateMaintenanceTicket,
  deleteMaintenanceTicket,
} from './maintenance.controller.js'

const router = Router()

router.post('/maintenance', authenticate, authorize('tenant', 'admin'), createMaintenanceTicket)
router.get('/maintenance', authenticate, listMaintenanceTickets)
router.patch('/maintenance/:id', authenticate, updateMaintenanceTicket)
router.delete('/maintenance/:id', authenticate, deleteMaintenanceTicket)

export default router
