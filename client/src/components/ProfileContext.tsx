import { useState, type ReactNode } from 'react'
import { ProfileContext, LS_LOCAL, LS_SERVER } from './profile-context'

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLS(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // abaikan jika localStorage penuh/tidak tersedia
  }
}

function removeLS(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // abaikan
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [localDataUrl, setLocalDataUrl] = useState<string | null>(() => readLS(LS_LOCAL))
  const [serverUrl, setServerUrl] = useState<string | null>(() => readLS(LS_SERVER))

  const photoSrc = localDataUrl ?? serverUrl ?? '/elaina_profil.jpg'
  const isDefault = !localDataUrl && !serverUrl

  const applyLocal = (dataUrl: string) => {
    writeLS(LS_LOCAL, dataUrl)
    removeLS(LS_SERVER)
    setLocalDataUrl(dataUrl)
    setServerUrl(null)
  }

  const applyServer = (url: string) => {
    writeLS(LS_SERVER, url)
    removeLS(LS_LOCAL)
    setServerUrl(url)
    setLocalDataUrl(null)
  }

  const reset = () => {
    removeLS(LS_LOCAL)
    removeLS(LS_SERVER)
    setLocalDataUrl(null)
    setServerUrl(null)
  }

  return (
    <ProfileContext.Provider value={{ photoSrc, isDefault, applyLocal, applyServer, reset }}>
      {children}
    </ProfileContext.Provider>
  )
}