import { Router } from 'express'
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from 'shared'
import * as ctrl from '../controllers/auth'
import * as oauthCtrl from '../controllers/oauth'
import * as webauthnCtrl from '../controllers/webauthn'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/me', ctrl.me)
router.get('/providers', oauthCtrl.providers)
router.post('/register', validate(registerSchema), ctrl.register)
router.post('/login', validate(loginSchema), ctrl.login)
router.post('/logout', ctrl.logout)
router.post('/refresh', ctrl.refresh)
router.post('/change-password', validate(changePasswordSchema), ctrl.changePassword)

router.get('/google/login', oauthCtrl.googleLogin)
router.get('/google/callback', oauthCtrl.googleCallback)

router.post('/forgot', validate(forgotPasswordSchema), ctrl.forgot)
router.post('/reset', validate(resetPasswordSchema), ctrl.reset)

router.get('/webauthn/login/start', webauthnCtrl.beginLogin)
router.post('/webauthn/login/verify', webauthnCtrl.verifyLogin)
router.post('/webauthn/register/start', requireAuth, webauthnCtrl.beginRegister)
router.post('/webauthn/register/verify', requireAuth, webauthnCtrl.verifyRegister)
router.get('/webauthn/credentials', requireAuth, webauthnCtrl.listCredentials)
router.delete('/webauthn/credentials/:id', requireAuth, webauthnCtrl.removeCredential)

export default router