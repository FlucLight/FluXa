import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../components/useAuth'
import { useToast } from '../components/useToast'

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--color-ink)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[6px] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
      />
    </label>
  )
}

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen h-[100svh] items-center justify-center bg-[var(--color-surface)] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">FluXa</span>
          <span className="text-xs text-[var(--color-ink-muted)]">{subtitle}</span>
        </div>
        <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-lg">
          <h1 className="mb-4 font-display text-base font-bold text-[var(--color-ink)]">{title}</h1>
          {children}
        </div>
        <div className="mt-4 text-center text-xs text-[var(--color-ink-muted)]">{footer}</div>
      </div>
    </div>
  )
}

function GoogleButton({ label }: { label: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    api.auth
      .providers()
      .then(({ google }) => {
        if (!cancelled) setEnabled(google)
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div className="my-4 flex items-center gap-3 text-[11px] text-[var(--color-ink-faint)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        atau
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <button
        type="button"
        onClick={() => {
          window.location.href = '/api/auth/google/login'
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {label}
      </button>
    </>
  )
}

function PasskeyButton({ onClick }: { onClick: () => void }) {
  const [supported] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.PublicKeyCredential !== undefined : false
    } catch {
      return false
    }
  })
  if (!supported) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-[var(--color-border-strong)] bg-transparent px-3 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-sunken)] cursor-pointer"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
      Masuk dengan passkey / biometrik
    </button>
  )
}

export function Login() {
  const { login, loginWithPasskey } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const googleError = searchParams.get('google_error')

  useEffect(() => {
    if (googleError === 'state') toast.error('Sesi Google kedaluwarsa, coba lagi')
    else if (googleError === 'verify') toast.error('Email Google tidak terverifikasi')
    else if (googleError === 'exchange') toast.error('Gagal menghubungkan akun Google')
  }, [googleError, toast])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setSubmitting(false)
    }
  }

  const [passkeyBusy, setPasskeyBusy] = useState(false)

  async function onPasskey() {
    setPasskeyBusy(true)
    try {
      await loginWithPasskey()
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal masuk'
      toast.error(message.includes('tidak terdaftar') ? 'Belum ada passkey terdaftar. Registrasikan lewat menu Akun' : message)
    } finally {
      setPasskeyBusy(false)
    }
  }

  return (
    <AuthShell
      title="Masuk"
      subtitle="Kelola keuangan pribadi"
      footer={
        <>
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-[var(--color-focus)] hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" autoComplete="email" />
        <Field label="Kata sandi" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="mt-1 rounded-[6px] bg-[var(--color-focus)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
      <GoogleButton label="Masuk dengan Google" />
      <div className="mt-2">
        <PasskeyButton onClick={onPasskey} />
        {passkeyBusy && <p className="mt-2 text-center text-xs text-[var(--color-ink-muted)]">Menunggu biometrik…</p>}
      </div>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      await register(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mendaftar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Daftar Akun"
      subtitle="Akun pertama akan memakai data lama Anda"
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-focus)] hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nama" type="text" value={name} onChange={setName} placeholder="Nama Anda" autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" autoComplete="email" />
        <Field label="Kata sandi" type="password" value={password} onChange={setPassword} placeholder="Minimal 8 karakter" autoComplete="new-password" />
        <Field label="Konfirmasi kata sandi" type="password" value={confirm} onChange={setConfirm} placeholder="Ulangi kata sandi" autoComplete="new-password" />
        <button
          type="submit"
          disabled={submitting || !name || !email || !password || !confirm}
          className="mt-1 rounded-[6px] bg-[var(--color-focus)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Memproses…' : 'Daftar'}
        </button>
      </form>
      <GoogleButton label="Daftar dengan Google" />
    </AuthShell>
  )
}