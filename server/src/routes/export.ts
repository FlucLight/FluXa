import { Router } from 'express'
import * as ctrl from '../controllers/export'

const router = Router()
router.get('/csv', ctrl.exportCsv)
router.get('/xlsx', ctrl.exportXlsx)
router.get('/json', ctrl.exportJson)
router.post('/json', ctrl.importJson)
export default router