import { Router } from 'express'
import * as ctrl from '../controllers/transfers'

const router = Router()
router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.delete('/:id', ctrl.softDelete)
export default router