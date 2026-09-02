import { Router } from 'express'
import * as ctrl from '../controllers/budgets'
import { createBudgetSchema, updateBudgetSchema } from 'shared'
import { validate } from '../middleware/validate'

const router = Router()
router.get('/', ctrl.list)
router.post('/', validate(createBudgetSchema), ctrl.create)
router.patch('/:id', validate(updateBudgetSchema), ctrl.update)
router.delete('/:id', ctrl.remove)
export default router