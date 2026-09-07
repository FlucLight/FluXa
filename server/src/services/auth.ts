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
    if (typeof payload.sub !== 'string') return null
    return payload.sub
  } catch {
    return null
  }
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