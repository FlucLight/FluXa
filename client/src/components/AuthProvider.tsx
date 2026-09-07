import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { api } from '../api'
import type { AuthUser } from '../api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.auth
      .me()
      .then(({ user: me }) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: me } = await api.auth.login({ email, password })
    setUser(me)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: me } = await api.auth.register({ name, email, password })
    setUser(me)
  }, [])

  const loginWithPasskey = useCallback(async () => {
    const { options } = await api.webauthn.loginStart()
    if (!options) throw new Error('Passkey tidak tersedia')
    const response = await startAuthentication({ optionsJSON: options })
    const { user: me } = await api.webauthn.loginVerify(response)
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithPasskey, register, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}