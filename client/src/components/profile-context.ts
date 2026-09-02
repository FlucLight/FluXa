import { createContext, useContext } from 'react'

export const DEFAULT_PHOTO = '/elaina_profil.jpg'
export const LS_LOCAL = 'fluxa_profile_local'
export const LS_SERVER = 'fluxa_profile_server'

export type ProfileContextValue = {
  photoSrc: string
  isDefault: boolean
  applyLocal: (dataUrl: string) => void
  applyServer: (url: string) => void
  reset: () => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile harus dipakai di dalam ProfileProvider')
  return ctx
}