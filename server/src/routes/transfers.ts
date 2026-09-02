import { Router } from 'express'
import * as ctrl from '../controllers/transfers'
import { createTransferSchema } from 'shared'
import { validate } from '../middleware/validate'

const router = Router()
router.get('/', ctrl.list)
router.post('/', validate(createTransferSchema), ctrl.create)
router.delete('/:id', ctrl.softDelete)
export default router