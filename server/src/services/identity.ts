import { AsyncLocalStorage } from 'node:async_hooks'

export interface AuthUser {
  id: string
  email: string | null
  name: string
}

const LEGACY_USER_ID = 'a0000000-0000-0000-0000-000000000001'

interface AuthContext {
  user: AuthUser
}

const store = new AsyncLocalStorage<AuthContext>()

export { LEGACY_USER_ID }

export function runWithUser<T>(user: AuthUser, fn: () => T): T {
  return store.run({ user }, fn)
}

export function getRequestUser(): AuthUser | null {
  return store.getStore()?.user ?? null
}

export function requireUserId(): string {
  const user = store.getStore()?.user
  if (!user) throw new Error('Request without auth context')
  return user.id
}

export function userId(): string {
  return store.getStore()?.user.id ?? LEGACY_USER_ID
}