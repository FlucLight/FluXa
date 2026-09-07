import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { TelegramLinkStatus } from '../api'
import { useToast } from './useToast'
import { CopyIcon, TelegramIcon } from './Icons'

export function TelegramLink() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<TelegramLinkStatus | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [pendingUntil, setPendingUntil] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const { link: status } = await api.telegram.status()
      setLink(status)
    } catch {
      setLink(null)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    api.telegram
      .status()
      .then(({ link: status }) => setLink(status))
      .catch(() => setLink(null))
  }, [open])

  useEffect(() => {
    const target = pendingUntil
    if (!target) return undefined
    const expiresAtMs = new Date(target).getTime()

    const id = setInterval(() => {
      const remaining = expiresAtMs - Date.now()
      if (remaining <= 0) {
        setCountdown('Kode kedaluwarsa')
        return
      }
      setCountdown(`berlaku ${Math.ceil(remaining / 60000)} menit lagi`)
    }, 10000)

    return () => clearInterval(id)
  }, [pendingUntil])

  async function handleStart() {
    if (loading) return
    setLoading(true)
    try {
      const { code: newCode, expires_in_seconds } = await api.telegram.startLink()
      setCode(newCode)
      setPendingUntil(new Date(Date.now() + expires_in_seconds * 1000).toISOString())
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat kode tautan')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Kode disalin')
    } catch {
      toast.error('Gagal menyalin kode')
    }
  }

  async function handleRevoke() {
    if (loading) return
    if (!window.confirm('Lepas tautan Telegram ini?')) return
    setLoading(true)
    try {
      await api.telegram.revoke()
      setLink({ status: 'pending', chat_id: null, expires_at: null })
      setCode(null)
      setPendingUntil(null)
      setCountdown('')
      toast.success('Tautan Telegram dilepas')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal melepas tautan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] cursor-pointer"
      >
        Hubungkan Telegram
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {link?.status === 'linked' ? (
            <>
              <p className="px-1 text-[11px] font-semibold text-[var(--color-ink)]">
                Tertaut ke chat <span className="font-mono">{link.chat_id}</span>
              </p>
              <p className="px-1 text-[10px] text-[var(--color-ink-faint)]">
                Transaksi lewat bot Telegram masuk ke akun Anda.
              </p>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={loading}
                className="rounded-[6px] border border-[var(--color-negative)]/40 bg-[var(--color-negative-soft)] px-3 py-2 text-[11px] font-semibold text-[var(--color-negative)] transition-colors hover:border-[var(--color-negative)] hover:bg-[var(--color-negative)] hover:text-white disabled:opacity-40 cursor-pointer"
              >
                Lepas tautan
              </button>
            </>
          ) : code ? (
            <>
              <p className="px-1 text-[11px] font-semibold text-[var(--color-ink)]">Kirim kode ini ke bot:</p>
              <div className="flex items-stretch gap-1.5">
                <div className="flex-1 rounded-[6px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] px-3 py-2 text-center">
                  <span className="font-mono text-lg font-bold tracking-[0.2em] text-[var(--color-ink)]">{code}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Salin kode"
                  className="flex items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  <CopyIcon size={15} />
                </button>
              </div>
              <a
                href={`https://t.me/fluclight_finance_bot?start=${code}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-[6px] bg-[var(--color-focus)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                <TelegramIcon size={15} />
                Buka bot &amp; kirim kode
              </a>
              <p className="px-1 text-[10px] text-[var(--color-ink-faint)]">
                Kode terkirim otomatis ke bot saat chat dibuka. {countdown}
              </p>
            </>
          ) : (
            <>
              <p className="px-1 text-[10px] text-[var(--color-ink-faint)]">
                Hubungkan chat Telegram agar transaksi via bot masuk ke akun Anda.
              </p>
              <a
                href="https://t.me/fluclight_finance_bot"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                <TelegramIcon size={13} />
                Buka @fluclight_finance_bot
              </a>
              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="flex items-center justify-center w-full rounded-[6px] bg-[var(--color-focus)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {loading ? 'Memproses…' : 'Buat kode tautan'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}