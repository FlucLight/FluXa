import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'

export function Export() {
  const qc = useQueryClient()
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setMsg(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await api.export.importJson(data)
      setMsg(
        `Import berhasil: ${result.imported['transactions'] ?? 0} transaksi, ${
          result.imported['categories'] ?? 0
        } kategori dipulihkan.`,
      )
      qc.invalidateQueries()
    } catch (err) {
      setMsg(`Gagal: ${(err as Error).message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Export & Backup</h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Unduh data untuk audit atau simpan salinan lengkap database
        </p>
      </div>

      <section className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 flex flex-col gap-4 shadow-xs">
        <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
          Export Data
        </h2>
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)]">Spreadsheet CSV</p>
              <p className="text-[11px] text-[var(--color-ink-faint)]">
                Daftar semua transaksi aktif dalam format kolom tabel
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => api.export.csv().then((b) => download(b, 'transaksi.csv'))}
            >
              Download CSV
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)]">Backup Penuh (JSON)</p>
              <p className="text-[11px] text-[var(--color-ink-faint)]">
                Seluruh data: transaksi, kategori, payment methods, dan budget
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => api.export.json().then((b) => download(b, 'backup.json'))}
            >
              Download JSON
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 flex flex-col gap-3 shadow-xs">
        <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
          Restore / Import Data
        </h2>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Upload file JSON backup sebelumnya. Data yang sudah ada dengan ID sama akan dilewati
          (aman dari duplikasi).
        </p>
        <div className="flex items-center gap-3 pt-1">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <Button
            variant="primary"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Mengimport...' : 'Pilih File JSON Backup'}
          </Button>
        </div>
        {msg && (
          <p
            className={`text-xs p-2.5 rounded-[6px] ${
              msg.startsWith('Gagal')
                ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
                : 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
            }`}
          >
            {msg}
          </p>
        )}
      </section>
    </div>
  )
}