import { Router } from 'express'
import { createTransactionSchema, updateTransactionSchema } from 'shared'
import * as ctrl from '../controllers/transactions'
import * as parserCtrl from '../controllers/parser'
import { validate } from '../middleware/validate'

const router = Router()

router.post('/parse', parserCtrl.parsePreview)
router.post('/quick', parserCtrl.parseAndSave)

router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', validate(createTransactionSchema), ctrl.create)
router.patch('/:id', validate(updateTransactionSchema), ctrl.update)
router.delete('/:id', ctrl.softDelete)
router.post('/:id/restore', ctrl.restore)

export default router