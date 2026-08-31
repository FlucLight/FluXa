import { Router } from 'express'
import * as ctrl from '../controllers/recurring'

const router = Router()
router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.patch('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/trigger', ctrl.triggerDue)
export default router