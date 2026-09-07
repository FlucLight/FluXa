import type { Request, Response } from 'express'
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  hashPassword,
  hashToken,
  issueSession,
  revokeSessionByRawToken,
  rotateSession,
  setAuthCookies,
  verifyPassword,
} from '../services/auth'
import type { IssuedSession } from '../services/auth'
import {
  findUserWithHashByEmail,
  findUserWithHashById,
  registerUser,
  updatePasswordHash,
} from '../repositories/users'
import * as sessionRepo from '../repositories/sessions'

function userAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null
}

function sendSession(res: Response, status: number, session: IssuedSession): void {
  setAuthCookies(res, { access: session.access, refresh: session.refresh })
  res.status(status).json({ user: session.user })
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string }

  const existing = await findUserWithHashByEmail(email)
  if (existing) {
    res.status(409).json({ error: 'Email sudah terdaftar' })
    return
  }

  const passwordHash = await hashPassword(password)
  const result = await registerUser({ name, email, passwordHash })
  const session = await issueSession({ userId: result.user.id, userAgent: userAgent(req) })
  sendSession(res, 201, session)
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string }

  const user = await findUserWithHashByEmail(email)
  const valid = user?.password_hash ? await verifyPassword(password, user.password_hash) : false
  if (!user || !user.password_hash || !valid) {
    res.status(401).json({ error: 'Email atau kata sandi salah' })
    return
  }

  const session = await issueSession({ userId: user.id, userAgent: userAgent(req) })
  sendSession(res, 200, session)
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refresh = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE]
  if (refresh) await revokeSessionByRawToken(refresh)
  clearAuthCookies(res)
  res.status(204).end()
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refresh = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE]
  if (!refresh) {
    clearAuthCookies(res)
    res.status(401).json({ error: 'Sesi berakhir, silakan masuk kembali' })
    return
  }

  const session = await rotateSession({ rawRefresh: refresh, userAgent: userAgent(req) })
  if (!session) {
    clearAuthCookies(res)
    res.status(401).json({ error: 'Sesi berakhir, silakan masuk kembali' })
    return
  }

  sendSession(res, 200, session)
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  res.json({ user: req.user })
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }

  const { current_password, new_password } = req.body as { current_password: string; new_password: string }
  const user = await findUserWithHashById(req.user.id)
  if (!user?.password_hash) {
    res.status(400).json({ error: 'Akun ini tidak memiliki kata sandi' })
    return
  }

  const valid = await verifyPassword(current_password, user.password_hash)
  if (!valid) {
    res.status(400).json({ error: 'Kata sandi saat ini salah' })
    return
  }

  const nextHash = await hashPassword(new_password)
  await updatePasswordHash(user.id, nextHash)

  const refresh = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE]
  if (refresh) {
    const current = await sessionRepo.findSessionByTokenHash(hashToken(refresh))
    await sessionRepo.revokeAllSessions(user.id, current?.id)
  } else {
    await sessionRepo.revokeAllSessions(user.id)
  }

  res.json({ ok: true })
}