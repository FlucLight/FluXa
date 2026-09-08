import { useCallback, useEffect, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { api } from '../api'
import type { PasskeyPublic } from '../api'
import { useToast } from './useToast'
import { ConfirmModal } from './ConfirmModal'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PasskeyManager() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [credentials, setCredentials] = useState<PasskeyPublic[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { credentials: list } = await api.webauthn.list()
      setCredentials(list)
    } catch {
      setCredentials([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      api.webauthn
        .list()
        .then(({ credentials: list }) => setCredentials(list))
        .catch(() => setCredentials([]))
    }
  }, [open])

  async function handleAdd() {
    if (busy) return
    setBusy(true)
    try {
      const { options } = await api.webauthn.registerStart()
      const deviceName = window.prompt('Nama perangkat ini (contoh: iPhone)', '')?.trim() ?? null
      const response = await startRegistration({ optionsJSON: options })
      if (deviceName !== null) {
        await api.webauthn.registerVerify(response, deviceName || undefined)
      } else {
        await api.webauthn.registerVerify(response)
      }
      toast.success('Perangkat berhasil ditambahkan')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan perangkat')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(id: string) {
    if (busy) return
    setRemovingId(id)
  }

  async function confirmRemove() {
    if (busy || !removingId) return
    const id = removingId
    setRemovingId(null)
    setBusy(true)
    try {
      await api.webauthn.remove(id)
      toast.success('Perangkat dihapus')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus perangkat')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] cursor-pointer"
      >
        Kelola Passkey
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="flex items-center justify-center w-full rounded-[6px] bg-[var(--color-focus)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {busy ? 'Memproses…' : '+ Tambah perangkat'}
          </button>
          {credentials === null ? (
            <p className="px-1 text-[11px] text-[var(--color-ink-faint)]">Memuat…</p>
          ) : credentials.length === 0 ? (
            <p className="px-1 text-[11px] text-[var(--color-ink-faint)]">
              Belum ada passkey. Tambah perangkat untuk masuk dengan biometrik.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {credentials.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2 py-1.5"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[11px] font-semibold text-[var(--color-ink)]">
                      {c.device_name ?? '(tanpa nama)'}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-faint)]">
                      Aktif sejak {formatDate(c.created_at)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.id)}
                    disabled={busy}
                    className="shrink-0 rounded-[5px] px-1.5 py-1 text-[11px] font-semibold text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)] disabled:opacity-40 cursor-pointer"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={removingId !== null}
        title="Hapus Passkey"
        message="Perangkat ini tidak akan bisa dipakai lagi untuk masuk lewat biometrik. Lanjutkan?"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setRemovingId(null)}
        isLoading={busy}
      />
    </div>
  )
}