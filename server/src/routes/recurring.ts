import { Router } from 'express'
import { createRecurringSchema, updateRecurringSchema } from 'shared'
import * as ctrl from '../controllers/recurring'
import { validate } from '../middleware/validate'

const router = Router()
router.get('/', ctrl.list)
router.post('/', validate(createRecurringSchema), ctrl.create)
router.patch('/:id', validate(updateRecurringSchema), ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/trigger', ctrl.triggerDue)
export default router