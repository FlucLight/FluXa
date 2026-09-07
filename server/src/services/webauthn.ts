import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from '@simplewebauthn/server'
import { env } from '../config/env'
import { findPasskeyByCredentialId, updatePasskeyCounter } from '../repositories/passkeys'
import type { AuthUser } from './identity'

const CHALLENGE_TTL_MS = 2 * 60 * 1000

interface ChallengeMeta {
  userId: string | null
  expiresAt: number
}

const challenges = new Map<string, ChallengeMeta>()

export function rpId(): string {
  return new URL(env.PUBLIC_BASE).hostname
}

export function expectedOrigin(): string {
  return env.CLIENT_ORIGIN
}

function storeChallenge(challenge: string, meta: ChallengeMeta): void {
  challenges.set(challenge, meta)
  setTimeout(() => challenges.delete(challenge), CHALLENGE_TTL_MS + 10_000)
}

function takeChallenge(challenge: string): ChallengeMeta | null {
  const meta = challenges.get(challenge)
  if (!meta || meta.expiresAt < Date.now()) return null
  challenges.delete(challenge)
  return meta
}

function extractChallenge(response: RegistrationResponseJSON | AuthenticationResponseJSON): string {
  try {
    const decoded = JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf8')) as {
      challenge?: unknown
    }
    if (typeof decoded.challenge === 'string') return decoded.challenge
  } catch {
    // fallthrough
  }
  throw new Error('Response tidak valid')
}

export function isWebAuthnAvailable(): boolean {
  return Boolean(env.PUBLIC_BASE && env.CLIENT_ORIGIN)
}

export async function beginRegistration(input: {
  user: AuthUser
  excludeCredentialIds: string[]
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const options = await generateRegistrationOptions({
    rpName: 'FluXa',
    rpID: rpId(),
    userName: input.user.email ?? input.user.id,
    userID: new TextEncoder().encode(input.user.id),
    userDisplayName: input.user.name,
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
    excludeCredentials: input.excludeCredentialIds.map((id) => ({ id })),
  })
  storeChallenge(options.challenge, { userId: input.user.id, expiresAt: Date.now() + CHALLENGE_TTL_MS })
  return options
}

export async function verifyRegistration(input: {
  response: RegistrationResponseJSON
  userId: string
}): Promise<{ credentialId: string; publicKey: string; counter: number }> {
  const challenge = extractChallenge(input.response)
  const meta = takeChallenge(challenge)
  if (!meta || meta.userId !== input.userId) {
    throw new Error('Challenge tidak valid atau kedaluwarsa')
  }

  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: challenge,
    expectedOrigin: expectedOrigin(),
    expectedRPID: rpId(),
  })
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Gagal memverifikasi perangkat')
  }

  return {
    credentialId: verification.registrationInfo.credential.id,
    publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64url'),
    counter: verification.registrationInfo.credential.counter,
  }
}

export async function beginAuthentication(): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  if (!isWebAuthnAvailable()) return null
  const options = await generateAuthenticationOptions({
    rpID: rpId(),
    userVerification: 'preferred',
  })
  storeChallenge(options.challenge, { userId: null, expiresAt: Date.now() + CHALLENGE_TTL_MS })
  return options
}

export async function verifyAuthentication(input: {
  response: AuthenticationResponseJSON
}): Promise<{ userId: string }> {
  const challenge = extractChallenge(input.response)
  const meta = takeChallenge(challenge)
  if (!meta) {
    throw new Error('Challenge tidak valid atau kedaluwarsa')
  }

  const passkey = await findPasskeyByCredentialId(input.response.id)
  if (!passkey) {
    throw new Error('Perangkat tidak terdaftar')
  }

  const credential: WebAuthnCredential = {
    id: passkey.credential_id,
    publicKey: Buffer.from(passkey.public_key, 'base64url'),
    counter: Number(passkey.counter),
    ...(passkey.transports && passkey.transports.length ? { transports: passkey.transports } : {}),
  }

  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge: challenge,
    expectedOrigin: expectedOrigin(),
    expectedRPID: rpId(),
    credential,
  })
  if (!verification.verified) {
    throw new Error('Gagal memverifikasi biometrik')
  }

  await updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter)
  return { userId: passkey.user_id }
}