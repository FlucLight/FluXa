import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../components/useToast'
import { AuthShell, Field } from './Auth'

export function ForgotPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.auth.forgotPassword(email)
      toast.success('Jika email terdaftar, tautan atur ulang sudah dikirim')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim tautan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle="Masukkan email untuk menerima tautan atur ulang"
      footer={
        <>
          <Link to="/login" className="font-semibold text-[var(--color-focus)] hover:underline">
            Kembali ke masuk
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" autoComplete="email" />
        <button
          type="submit"
          disabled={submitting || !email}
          className="mt-1 rounded-[6px] bg-[var(--color-focus)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Mengirim…' : 'Kirim tautan atur ulang'}
        </button>
      </form>
    </AuthShell>
  )
}