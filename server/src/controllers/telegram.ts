import { randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { hashToken } from '../services/auth'
import * as linkRepo from '../repositories/telegramLinks'

const LINK_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LINK_CODE_LENGTH = 8
const LINK_CODE_TTL_MS = 10 * 60 * 1000

function generateLinkCode(): string {
  const bytes = randomBytes(LINK_CODE_LENGTH)
  let code = ''
  for (let index = 0; index < LINK_CODE_LENGTH; index += 1) {
    code += LINK_CODE_ALPHABET[bytes[index]! % LINK_CODE_ALPHABET.length]
  }
  return code
}

export async function startLink(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  void linkRepo.purgeExpiredPendingLinks()

  const code = generateLinkCode()
  await linkRepo.createPendingLink({
    userId: req.user.id,
    codeHash: hashToken(code),
    expiresAt: new Date(Date.now() + LINK_CODE_TTL_MS),
  })

  res.json({ code, expires_in_seconds: LINK_CODE_TTL_MS / 1000 })
}

export async function status(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  const status = await linkRepo.getLinkStatus(req.user.id)
  res.json({ link: status })
}

export async function revoke(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  await linkRepo.revokeLink(req.user.id)
  res.json({ ok: true })
}