import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../components/useToast'
import { AuthShell, Field } from './Auth'

export function ResetPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }
    setSubmitting(true)
    try {
      await api.auth.resetPassword(token, password)
      toast.success('Kata sandi berhasil diatur ulang, silakan masuk')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengatur ulang kata sandi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Atur Ulang Kata Sandi"
      subtitle="Buat kata sandi baru untuk akun Anda"
      footer={
        <>
          <Link to="/login" className="font-semibold text-[var(--color-focus)] hover:underline">
            Kembali ke masuk
          </Link>
        </>
      }
    >
      {!token ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Tautan atur ulang tidak valid.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Kata sandi baru" type="password" value={password} onChange={setPassword} placeholder="Minimal 8 karakter" autoComplete="new-password" />
          <Field label="Konfirmasi kata sandi" type="password" value={confirm} onChange={setConfirm} placeholder="Ulangi kata sandi" autoComplete="new-password" />
          <button
            type="submit"
            disabled={submitting || !password || !confirm}
            className="mt-1 rounded-[6px] bg-[var(--color-focus)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Menyimpan…' : 'Atur ulang kata sandi'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}