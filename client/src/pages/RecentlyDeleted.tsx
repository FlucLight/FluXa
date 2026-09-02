import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { CategorySymbolIcon } from '../components/Icons'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { Pagination, type PageSize } from '../components/Pagination'
import { useToast } from '../components/useToast'
import { formatDate, formatRp } from '../utils'

export function RecentlyDeleted() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(0)

  const deletedParams = pageSize === 'all'
    ? { limit: 'all' as const }
    : { limit: pageSize, offset: page * pageSize }

  const { data: deletedPage = { rows: [], count: 0 }, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions-deleted', pageSize, page],
    queryFn: () => api.transactions.deletedWithCount(deletedParams),
  })
  const txs = deletedPage.rows

  const { data: categories = [], isError: isCategoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.transactions.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['recent-transactions'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
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
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Transaksi Terhapus</h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Data yang dihapus (soft-delete) dapat dikembalikan sewaktu-waktu
        </p>
      </div>

      {isLoading && <ListSkeleton rows={pageSize === 'all' ? 6 : Number(pageSize)} />}
      {!isLoading && (isError || isCategoriesError) && (
        <ErrorState
          title="Gagal memuat data"
          description="Terjadi kesalahan saat mengambil data transaksi terhapus. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchCategories()
          }}
        />
      )}
      {!isLoading && !isError && !isCategoriesError && txs.length === 0 && (
        <EmptyState
          title="Tidak ada transaksi terhapus"
          description="Transaksi yang dihapus akan muncul di sini dan dapat dipulihkan."
        />
      )}

      {txs.length > 0 && (
        <>
        <p className="text-[11px] text-[var(--color-ink-faint)] md:hidden">Geser tabel ke samping untuk melihat kolom lainnya.</p>
        <div className="mobile-table-scroll bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-xs">
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
        <Pagination
          totalItems={deletedPage.count}
          pageSize={pageSize}
          page={page}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          label="transaksi terhapus"
        />
        </>
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