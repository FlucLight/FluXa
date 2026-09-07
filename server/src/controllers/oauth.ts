import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { env } from '../config/env'
import { clearAuthCookies, issueSession, setAuthCookies } from '../services/auth'
import { claimOrCreateGoogleUser } from '../repositories/users'
import { exchangeGoogleCode, googleAuthUrl, isGoogleEnabled } from '../services/oauth'

const OAUTH_STATE_COOKIE = 'fluxa_oauth_state'

const stateCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 10 * 60 * 1000,
}

export async function providers(_req: Request, res: Response): Promise<void> {
  res.json({ google: isGoogleEnabled() })
}

export async function googleLogin(_req: Request, res: Response): Promise<void> {
  if (!isGoogleEnabled()) {
    res.status(400).json({ error: 'Login Google tidak tersedia' })
    return
  }

  const state = randomBytes(24).toString('hex')
  const url = await googleAuthUrl(state)
  if (!url) {
    res.status(500).json({ error: 'Gagal menyiapkan Google OAuth' })
    return
  }

  res.cookie(OAUTH_STATE_COOKIE, state, stateCookieOptions)
  res.redirect(url)
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const cookies = req.cookies as Record<string, string> | undefined
  const storedState = cookies?.[OAUTH_STATE_COOKIE]
  res.clearCookie(OAUTH_STATE_COOKIE, { ...stateCookieOptions })

  const incomingState = typeof req.query.state === 'string' ? req.query.state : ''
  if (!storedState || !incomingState || storedState !== incomingState) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?google_error=state`)
    return
  }

  try {
    const profile = await exchangeGoogleCode(incomingState, storedState)
    if (!profile || !profile.emailVerified) {
      res.redirect(`${env.CLIENT_ORIGIN}/login?google_error=verify`)
      return
    }

    const { user } = await claimOrCreateGoogleUser({
      email: profile.email,
      name: profile.name ?? profile.email.split('@')[0] ?? 'FluXa User',
      googleSub: profile.sub,
    })

    const session = await issueSession({ userId: user.id, userAgent: req.headers['user-agent'] ?? null })
    setAuthCookies(res, { access: session.access, refresh: session.refresh })

    res.redirect(`${env.CLIENT_ORIGIN}/`)
  } catch (error) {
    console.error('[oauth] callback error:', error)
    clearAuthCookies(res)
    res.redirect(`${env.CLIENT_ORIGIN}/login?google_error=exchange`)
  }
}