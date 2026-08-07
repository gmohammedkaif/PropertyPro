import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
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
router.post('/tenancies', authenticate, createTenancy)
router.patch('/tenancies/:id', authenticate, updateTenancy)
router.delete('/tenancies/:id', authenticate, deleteTenancy)

export default router
