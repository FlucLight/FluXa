import { Router } from 'express'
import * as ctrl from '../controllers/summary'

const router = Router()
router.get('/totals', ctrl.totals)
router.get('/balances', ctrl.balances)

export default router
