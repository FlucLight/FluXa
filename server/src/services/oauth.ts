import * as oidc from 'openid-client'
import { env } from '../config/env'

let cachedConfig: oidc.Configuration | null = null

export function isGoogleEnabled(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

function redirectUri(): string {
  return `${env.PUBLIC_BASE}/api/auth/google/callback`
}

async function googleConfig(): Promise<oidc.Configuration | null> {
  if (!isGoogleEnabled()) return null
  if (cachedConfig) return cachedConfig
  cachedConfig = await oidc.discovery(new URL('https://accounts.google.com'), env.GOOGLE_CLIENT_ID, {
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [redirectUri()],
  })
  return cachedConfig
}

export async function googleAuthUrl(state: string): Promise<string | null> {
  const config = await googleConfig()
  if (!config) return null
  return oidc
    .buildAuthorizationUrl(config, {
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    })
    .toString()
}

export interface GoogleProfile {
  sub: string
  email: string
  name: string | null
  picture: string | null
  emailVerified: boolean
}

export async function exchangeGoogleCode(code: string, expectedState: string): Promise<GoogleProfile | null> {
  const config = await googleConfig()
  if (!config) return null

  const currentUrl = new URL(redirectUri())
  currentUrl.searchParams.set('code', code)
  currentUrl.searchParams.set('state', expectedState)

  const tokenSet = await oidc.authorizationCodeGrant(config, currentUrl, { expectedState })
  const claims = tokenSet.claims()
  if (!claims) return null

  const email = typeof claims.email === 'string' ? claims.email : null
  if (!email) return null

  return {
    sub: claims.sub,
    email,
    name: typeof claims.name === 'string' ? claims.name : null,
    picture: typeof claims.picture === 'string' ? claims.picture : null,
    emailVerified: claims.email_verified === true,
  }
}