import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { useToast } from '../components/useToast'

export function Export() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [importing, setImporting] = useState(false)
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
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await api.export.importJson(data)
      success(
        `Berhasil mengimpor ${result.imported['transactions'] ?? 0} transaksi, ${
          result.imported['categories'] ?? 0
        } kategori dipulihkan.`,
        'Restore Berhasil'
      )
      qc.invalidateQueries()
    } catch (err) {
      toastError((err as Error).message, 'Gagal Import')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="w-full min-w-0 max-w-2xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-6">
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
          <div className="flex flex-col items-start gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)]">Spreadsheet CSV</p>
              <p className="text-[11px] text-[var(--color-ink-faint)]">
                Daftar semua transaksi aktif dalam format kolom tabel
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                api.export.csv()
                  .then((b) => {
                    download(b, 'transaksi.csv')
                    success('File CSV transaksi berhasil diunduh')
                  })
                  .catch((err) => toastError((err as Error).message, 'Gagal Download'))
              }}
            >
              Download CSV
            </Button>
          </div>

          <div className="flex flex-col items-start gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)]">Backup Penuh (JSON)</p>
              <p className="text-[11px] text-[var(--color-ink-faint)]">
                Seluruh data: transaksi, kategori, payment methods, dan budget
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                api.export.json()
                  .then((b) => {
                    download(b, 'backup.json')
                    success('File backup database (JSON) berhasil diunduh')
                  })
                  .catch((err) => toastError((err as Error).message, 'Gagal Download'))
              }}
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
            className="w-full sm:w-auto"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Mengimport...' : 'Pilih File JSON Backup'}
          </Button>
        </div>
      </section>
    </div>
  )
}