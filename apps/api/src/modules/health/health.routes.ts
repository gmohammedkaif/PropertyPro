import { Router } from 'express'

import { getHealth, getLivez, getReadyz } from './health.controller.js'

const router = Router()

router.get('/health', getHealth)
router.get('/health/livez', getLivez)
router.get('/health/readyz', getReadyz)

export default router
