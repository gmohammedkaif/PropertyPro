import { Router } from 'express'
import { authenticate, authorize } from '../auth/auth.middleware.js'
import {
  listTenancies,
  getMyLease,
  getMyTenancy,
  createTenancy,
  updateTenancy,
  deleteTenancy,
} from './tenancy.controller.js'

const router = Router()

router.get('/tenancies', authenticate, listTenancies)
router.get('/tenancies/my-lease', authenticate, getMyLease)
router.get('/tenancies/my-tenancy', authenticate, getMyTenancy)
router.post('/tenancies', authenticate, authorize('owner', 'admin'), createTenancy)
router.patch('/tenancies/:id', authenticate, authorize('owner', 'admin'), updateTenancy)
router.delete('/tenancies/:id', authenticate, authorize('owner', 'admin'), deleteTenancy)

export default router
