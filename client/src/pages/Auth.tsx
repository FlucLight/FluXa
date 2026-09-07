import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    </AuthShell>
  )
}