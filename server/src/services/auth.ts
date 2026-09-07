import { createHash, randomBytes } from 'node:crypto'
import type { Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { findUserById } from '../repositories/users'
import * as sessionRepo from '../repositories/sessions'
import type { AuthUser } from './identity'

const BCRYPT_ROUNDS = 12

let secret = env.JWT_SECRET
if (!secret) {
  secret = 'dev-insecure-jwt-secret-change-me'
  console.warn('[auth] JWT_SECRET tidak di-set — menggunakan secret pengembangan yang TIDAK aman untuk produksi.')
}

const usesFallbackSecret = env.JWT_SECRET === ''
const secretFingerprint = secret ? createHash('sha256').update(secret).digest('hex').slice(0, 8) : 'EMPTY'

function decodeJwt(token: string): { header: jwt.JwtHeader | null; payload: jwt.JwtPayload | null } {
  try {
    const decoded = jwt.decode(token, { complete: true }) as { header: jwt.JwtHeader; payload: jwt.JwtPayload } | null
    if (!decoded) return { header: null, payload: null }
    return { header: decoded.header, payload: decoded.payload }
  } catch {
    return { header: null, payload: null }
  }
}

export const ACCESS_COOKIE = 'fluxa_at'
export const REFRESH_COOKIE = 'fluxa_rt'

export interface AuthCookies {
  access: string
  refresh: string
}

const baseCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
}

function accessCookieOptions() {
  return { ...baseCookieOptions, maxAge: env.JWT_ACCESS_TTL_MINUTES * 60 * 1000 }
}

function refreshCookieOptions() {
  return { ...baseCookieOptions, maxAge: env.AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000 }
}

export function setAuthCookies(res: Response, cookies: AuthCookies): void {
  res.cookie(ACCESS_COOKIE, cookies.access, accessCookieOptions())
  res.cookie(REFRESH_COOKIE, cookies.refresh, refreshCookieOptions())
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookieOptions })
  res.clearCookie(REFRESH_COOKIE, { ...baseCookieOptions })
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, secret!, {
    subject: userId,
    expiresIn: `${env.JWT_ACCESS_TTL_MINUTES}m`,
  })
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, secret!)
    if (typeof payload.sub !== 'string') {
      console.error('[AUTH DEBUG][/me] verify OK tapi sub bukan string:', JSON.stringify({
        payload,
        serverTime: new Date().toISOString(),
        secretFingerprint,
        usesFallbackSecret,
      }))
      return null
    }
    return payload.sub
  } catch (error) {
    const decoded = decodeJwt(token)
    const claims = decoded.payload
    const nowSec = Math.floor(Date.now() / 1000)
    const expIn = typeof claims?.exp === 'number' ? claims.exp - nowSec : null
    console.error('[AUTH DEBUG][/me] verify failed:', JSON.stringify({
      errorName: (error as Error)?.name ?? null,
      errorMessage: (error as Error)?.message ?? null,
      headerAlg: decoded.header?.alg ?? null,
      decodedClaims: claims
        ? { iss: claims.iss, aud: claims.aud, sub: claims.sub, exp: claims.exp, iat: claims.iat }
        : null,
      serverTime: new Date().toISOString(),
      nowEpochSec: nowSec,
      expInSeconds: expIn,
      expDate: typeof claims?.exp === 'number' ? new Date(claims.exp * 1000).toISOString() : null,
      secretFingerprint,
      usesFallbackSecret,
    }))
    return null
  }
}

export function logDebugIssuedAccess(tag: string, access: string): void {
  const { header, payload } = decodeJwt(access)
  const cookie = accessCookieOptions()
  console.log(`[AUTH DEBUG][${tag}] new token issued:`, JSON.stringify({
    headerAlg: header?.alg ?? null,
    claims: payload
      ? { iss: payload.iss, aud: payload.aud, sub: payload.sub, exp: payload.exp, iat: payload.iat }
      : null,
    serverTime: new Date().toISOString(),
    expDate: typeof payload?.exp === 'number' ? new Date(payload.exp * 1000).toISOString() : null,
    cookie: {
      name: ACCESS_COOKIE,
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: baseCookieOptions.sameSite,
      path: cookie.path ?? '/',
      maxAgeMs: cookie.maxAge ?? null,
    },
    secretFingerprint,
    usesFallbackSecret,
  }))
}

export interface IssuedSession {
  access: string
  refresh: string
  user: AuthUser
}

export async function issueSession(input: {
  userId: string
  userAgent: string | null
  expiresAt?: Date
}): Promise<IssuedSession> {
  const user = await findUserById(input.userId)
  if (!user) throw new Error('User not found')

  const refresh = generateRefreshToken()
  const refreshHash = hashToken(refresh)
  const expiresAt = input.expiresAt ?? new Date(Date.now() + env.AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000)
  await sessionRepo.createSession({
    userId: user.id,
    tokenHash: refreshHash,
    userAgent: input.userAgent,
    expiresAt,
  })

  return { access: signAccessToken(user.id), refresh, user }
}

export async function rotateSession(input: {
  rawRefresh: string
  userAgent: string | null
}): Promise<IssuedSession | null> {
  const tokenHash = hashToken(input.rawRefresh)
  const session = await sessionRepo.findSessionByTokenHash(tokenHash)
  if (!session || session.revoked_at) return null
  if (session.expires_at.getTime() <= Date.now()) return null

  const user = await findUserById(session.user_id)
  if (!user) return null

  await sessionRepo.touchSession(session.id)
  await sessionRepo.revokeSession(session.id)

  return issueSession({
    userId: session.user_id,
    userAgent: input.userAgent,
    expiresAt: session.expires_at,
  })
}

export async function revokeSessionByRawToken(rawRefresh: string): Promise<void> {
  if (!rawRefresh) return
  const tokenHash = hashToken(rawRefresh)
  const session = await sessionRepo.findSessionByTokenHash(tokenHash)
  if (session && !session.revoked_at) {
    await sessionRepo.revokeSession(session.id)
  }
}

export function sessionExpiryMs(): number {
  return env.AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000
}