import type { NextFunction, Request, Response } from 'express'
import { findUserById } from '../repositories/users'
import { ACCESS_COOKIE, verifyAccessToken } from '../services/auth'
import type { AuthUser } from '../services/identity'
import { runWithUser } from '../services/identity'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

function extractBearer(authorization: string | undefined): string | null {
  if (!authorization) return null
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
  return match ? (match[1] ?? null) : null
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const cookies = req.cookies as Record<string, string | undefined> | undefined
  const token = cookies?.[ACCESS_COOKIE] ?? extractBearer(req.headers.authorization)

  if (!token) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }

  const userId = verifyAccessToken(token)
  if (!userId) {
    res.status(401).json({ error: 'Sesi berakhir, silakan masuk kembali' })
    return
  }

  const user = await findUserById(userId)
  if (!user) {
    res.status(401).json({ error: 'Akun tidak ditemukan' })
    return
  }

  req.user = user
  runWithUser(user, () => next())
}