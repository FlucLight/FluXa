import { useRef, useState } from 'react'
import { api } from '../api'
import { useProfile } from './profile-context'
import { useToast } from './useToast'

const MAX_SIZE = 512

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Gagal membaca gambar'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const ext = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      resolve(canvas.toDataURL(ext, 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak valid'))
    }
    img.src = url
  })
}

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

export function AvatarEditor() {
  const { photoSrc, isDefault, applyLocal, applyServer, reset } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await compressImage(file)
      applyLocal(dataUrl)
      toast.success('Foto profil diperbarui')

      const res = await api.profile.upload(file)
      applyServer(res.url)
    } catch (err) {
      toast.error((err as Error).message, 'Gagal Upload')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="group relative">
      <div className={`h-16 w-16 overflow-hidden rounded-full ${busy ? 'opacity-60' : ''}`}>
        <img src={photoSrc} alt="Foto profil" className="h-full w-full object-cover" />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        aria-label="Ganti foto profil"
        title="Ganti foto profil"
        className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-surface-raised)] bg-[var(--color-ink)] text-[var(--color-surface-raised)] transition-colors hover:bg-[var(--color-ink-muted)] disabled:opacity-60"
      >
        <CameraIcon />
      </button>

      {!isDefault && (
        <button
          type="button"
          disabled={busy}
          onClick={() => reset()}
          aria-label="Hapus foto profil"
          title="Hapus foto profil"
          className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--color-surface-raised)] bg-[var(--color-negative)] text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          <TrashIcon />
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}