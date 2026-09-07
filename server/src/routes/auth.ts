import { Router } from 'express'
import { changePasswordSchema, loginSchema, registerSchema } from 'shared'
import * as ctrl from '../controllers/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/me', ctrl.me)
router.post('/register', validate(registerSchema), ctrl.register)
router.post('/login', validate(loginSchema), ctrl.login)
router.post('/logout', ctrl.logout)
router.post('/refresh', ctrl.refresh)
router.post('/change-password', validate(changePasswordSchema), ctrl.changePassword)

export default router