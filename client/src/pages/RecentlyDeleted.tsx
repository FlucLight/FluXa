import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { CategorySymbolIcon } from '../components/Icons'
import { useToast } from '../components/Toast'
import { formatDate, formatRp } from '../utils'

export function RecentlyDeleted() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions-deleted'],
    queryFn: () => api.transactions.deleted(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.transactions.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['transactions-deleted'] })
      success('Transaksi berhasil dipulihkan kembali')
      setRestoringId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Memulihkan')
      setRestoringId(null)
    },
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Transaksi Terhapus</h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Data yang dihapus (soft-delete) dapat dikembalikan sewaktu-waktu
        </p>
      </div>

      {isLoading && <p className="text-xs text-[var(--color-ink-faint)]">Memuat...</p>}
      {!isLoading && txs.length === 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-8 text-center shadow-xs">
          <p className="text-xs text-[var(--color-ink-muted)]">Tidak ada transaksi yang sedang dihapus.</p>
        </div>
      )}

      {txs.length > 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Kategori</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {txs.map((tx) => {
                const cat = catMap[tx.category_id]
                return (
                  <tr key={tx.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] tabular-nums">
                      {formatDate(tx.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink)]">{tx.description ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {cat ? (
                        <span className="inline-flex items-center gap-1.5 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] px-2 py-0.5 rounded-[4px]">
                          <CategorySymbolIcon name={cat.name} size={12} className="text-[var(--color-ink-muted)]" />
                          <span>{cat.name}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        tx.type === 'expense' ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                      }`}
                    >
                      {formatRp(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => setRestoringId(tx.id)}
                        disabled={restoreMutation.isPending}
                      >
                        Pulihkan
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(restoringId)}
        title="Pulihkan Transaksi"
        message="Apakah Anda yakin ingin memulihkan kembali transaksi ini ke daftar aktif?"
        confirmLabel="Pulihkan"
        variant="primary"
        onConfirm={() => {
          if (restoringId) restoreMutation.mutate(restoringId)
        }}
        onCancel={() => setRestoringId(null)}
        isLoading={restoreMutation.isPending}
      />
    </div>
  )
}