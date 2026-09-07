import type { Request, Response } from 'express'
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server'
import { clearAuthCookies, issueSession, setAuthCookies } from '../services/auth'
import {
  beginAuthentication,
  beginRegistration,
  verifyAuthentication,
  verifyRegistration,
} from '../services/webauthn'
import { createPasskey, deletePasskey, listPasskeysByUser, findPasskeyByCredentialId } from '../repositories/passkeys'
import { findUserById } from '../repositories/users'

export async function beginRegister(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  const existing = await listPasskeysByUser(req.user.id)
  const options = await beginRegistration({
    user: req.user,
    excludeCredentialIds: existing.map((p) => p.id),
  })
  res.json({ options, existing_count: existing.length })
}

export async function verifyRegister(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  const { response, device_name } = req.body as {
    response: RegistrationResponseJSON
    device_name?: string | null
  }

  const verification = await verifyRegistration({ response, userId: req.user.id })
  const existing = await findPasskeyByCredentialId(verification.credentialId)
  if (existing) {
    res.status(409).json({ error: 'Perangkat sudah terdaftar' })
    return
  }

  await createPasskey({
    userId: req.user.id,
    credentialId: verification.credentialId,
    publicKey: verification.publicKey,
    counter: verification.counter,
    transports: response.response.transports ?? null,
    deviceName: device_name?.trim().slice(0, 100) || null,
  })
  res.json({ ok: true })
}

export async function beginLogin(_req: Request, res: Response): Promise<void> {
  const options = await beginAuthentication()
  if (!options) {
    res.status(400).json({ error: 'Passkey tidak tersedia' })
    return
  }
  res.json({ options })
}

export async function verifyLogin(req: Request, res: Response): Promise<void> {
  const { response } = req.body as { response: AuthenticationResponseJSON }
  const result = await verifyAuthentication({ response })
  const user = await findUserById(result.userId)
  if (!user) {
    clearAuthCookies(res)
    res.status(401).json({ error: 'Akun tidak ditemukan' })
    return
  }

  const session = await issueSession({ userId: user.id, userAgent: req.headers['user-agent'] ?? null })
  setAuthCookies(res, { access: session.access, refresh: session.refresh })
  res.json({ user: session.user })
}

export async function listCredentials(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  const credentials = await listPasskeysByUser(req.user.id)
  res.json({ credentials })
}

export async function removeCredential(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Anda belum masuk' })
    return
  }
  const removed = await deletePasskey(String(req.params['id'] ?? ''), req.user.id)
  if (!removed) {
    res.status(404).json({ error: 'Perangkat tidak ditemukan' })
    return
  }
  res.json({ ok: true })
}