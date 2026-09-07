import { Router } from 'express'
import * as ctrl from '../controllers/telegram'

const router = Router()

router.post('/link/start', ctrl.startLink)
router.get('/link', ctrl.status)
router.delete('/link', ctrl.revoke)

export default router