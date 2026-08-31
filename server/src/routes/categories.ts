import { Router } from 'express'
import { createCategorySchema, updateCategorySchema } from 'shared'
import * as ctrl from '../controllers/categories'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)
router.post('/', validate(createCategorySchema), ctrl.create)
router.patch('/:id', validate(updateCategorySchema), ctrl.update)
router.delete('/:id', ctrl.remove)

export default router