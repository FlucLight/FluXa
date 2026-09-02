import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ListSkeleton } from '../components/ListStates'
import { FilterBar } from '../components/FilterBar'
import { CategorySymbolIcon } from '../components/Icons'
import { Pagination, type PageSize } from '../components/Pagination'
import { useToast } from '../components/useToast'
import { TransactionForm } from '../components/TransactionForm'
import {
  formatDate,
  formatRp,
  fromLocalDateInput,
  getPresetDateRange,
  type PeriodPreset,
  type SortOrder,
} from '../utils'

export function Transactions() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TransactionRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pmFilter, setPmFilter] = useState('')
  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortOrder | ''>('')
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const dateRange =
    preset === 'custom'
      ? {
          from: customFrom ? fromLocalDateInput(customFrom) : undefined,
          to: customTo ? fromLocalDateInput(customTo, true) : undefined,
        }
      : getPresetDateRange(preset)

  const params: Record<string, string> = {}
  if (typeFilter) params['type'] = typeFilter
  if (categoryFilter) params['category_id'] = categoryFilter
  if (pmFilter) params['payment_method_id'] = pmFilter
  if (dateRange.from) params['from'] = dateRange.from
  if (dateRange.to) params['to'] = dateRange.to
  if (sort) params['sort'] = sort
  if (search.trim()) params['search'] = search.trim()
  if (pageSize === 'all') params['limit'] = 'all'
  else {
    params['limit'] = String(pageSize)
    params['offset'] = String(page * pageSize)
  }

  const { data: transactionPage = { rows: [], count: 0 }, isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.transactions.listWithCount(params),
  })
  const txs = transactionPage.rows
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })

  const handleReset = () => {
    setPreset('this_month')
    setCustomFrom('')
    setCustomTo('')
    setTypeFilter('')
    setCategoryFilter('')
    setPmFilter('')
    setSearchInput('')
    setSearch('')
    setSort('')
    setPage(0)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['recent-transactions'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      qc.invalidateQueries({ queryKey: ['transactions-deleted'] })
      success('Transaksi berhasil dipindahkan ke menu Terhapus')
      setDeletingId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.transactions.restore(id),
    onError: (err) => toastError((err as Error).message, 'Gagal Memulihkan'),
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['recent-transactions'] })
    qc.invalidateQueries({ queryKey: ['summary-balances'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['transactions-deleted'] })
  }

  const undoDelete = (ids: string[]) => {
    Promise.all(ids.map((id) => restoreMutation.mutateAsync(id)))
      .then(() => {
        invalidateAll()
        success(`${ids.length} transaksi dipulihkan kembali`)
        setSelectedIds(new Set())
      })
      .catch(() => toastError('Sebagian atau semua transaksi gagal dipulihkan', 'Gagal Undo'))
  }

  const bulkDelete = (ids: string[]) => {
    Promise.all(ids.map((id) => api.transactions.remove(id)))
      .then(() => {
        invalidateAll()
        setSelectedIds(new Set())
        success(`${ids.length} transaksi dipindahkan ke menu Terhapus`, undefined, {
          label: 'Undo',
          onClick: () => undoDelete(ids),
        })
      })
      .catch(() => toastError('Sebagian atau semua transaksi gagal dihapus', 'Gagal Menghapus'))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const ids = filteredTxs.map((t) => t.id)
      const allSelected = ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const pmMap = Object.fromEntries(paymentMethods.map((p) => [p.id, p]))

  const filteredTxs = txs

  const totalFilteredExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalFilteredIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <div className="w-full min-w-0 max-w-6xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Daftar Transaksi</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Kelola, telusuri, dan saring seluruh transaksi Anda
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto"
        >
          + Catat Transaksi
        </Button>
      </div>

      <FilterBar
        preset={preset}
        onPresetChange={(value) => {
          setPreset(value)
          setPage(0)
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={(value) => {
          setCustomFrom(value)
          setPage(0)
        }}
        onCustomToChange={(value) => {
          setCustomTo(value)
          setPage(0)
        }}
        categories={categories}
        selectedCategory={categoryFilter}
        onCategoryChange={(value) => {
          setCategoryFilter(value)
          setPage(0)
        }}
        paymentMethods={paymentMethods}
        selectedPm={pmFilter}
        onPmChange={(value) => {
          setPmFilter(value)
          setPage(0)
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(value) => {
          setTypeFilter(value)
          setPage(0)
        }}
        search={searchInput}
        onSearchChange={(value) => {
          setSearchInput(value)
          setPage(0)
        }}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(0)
        }}
        onReset={handleReset}
      />

      <div className="flex flex-col items-start gap-2 px-1 text-xs text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
           Menampilkan <b>{filteredTxs.length}</b> pada halaman ini dari <b>{transactionPage.count}</b> transaksi
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums font-semibold">
          <span className="text-[var(--color-positive)]">Total Masuk: +{formatRp(totalFilteredIncome)}</span>
          <span className="text-[var(--color-negative)]">Total Keluar: -{formatRp(totalFilteredExpense)}</span>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--color-focus)]/40 bg-[var(--color-focus)]/5 px-4 py-3">
          <span className="text-xs text-[var(--color-ink)]">
            <b className="font-bold">{selectedIds.size}</b> transaksi dipilih
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={toggleSelectAll}>
              {filteredTxs.every((t) => selectedIds.has(t.id)) ? 'Batal Pilih' : 'Pilih Semua di Halaman'}
            </Button>
            <Button variant="danger" onClick={() => bulkDelete([...selectedIds])}>
              Hapus Terpilih ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {isLoading && <ListSkeleton rows={pageSize === 'all' ? 6 : Number(pageSize)} />}

      {!isLoading && filteredTxs.length === 0 && (
        <EmptyState
          title="Tidak ada transaksi yang cocok"
          description="Ubah filter atau catat transaksi baru untuk mulai mengisi daftar."
          actionLabel="Catat Transaksi"
          onAction={() => {
            setEditing(null)
            setShowForm(true)
          }}
        />
      )}

      {filteredTxs.length > 0 && (
        <>
        <div className="flex flex-col gap-2.5 md:hidden">
          {filteredTxs.map((tx) => {
            const cat = catMap[tx.category_id]
            const pm = pmMap[tx.payment_method_id]
            const isExpense = tx.type === 'expense'
            return (
              <div
                key={tx.id}
                className={`rounded-[10px] border bg-[var(--color-surface-raised)] p-3.5 shadow-xs ${
                  selectedIds.has(tx.id) ? 'border-[var(--color-focus)]' : 'border-[var(--color-border)]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    aria-label="Pilih transaksi"
                    onClick={() => toggleSelect(tx.id)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors cursor-pointer ${
                      selectedIds.has(tx.id)
                        ? 'border-[var(--color-focus)] bg-[var(--color-focus)] text-[var(--color-btn-primary-text)]'
                        : 'border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] text-transparent'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-semibold text-[var(--color-ink)]">{cat?.name ?? 'Tanpa kategori'}</span>
                      {tx.needs_review && (
                        <span className="text-[10px] bg-[var(--color-warning-soft)] text-[var(--color-warning)] px-1.5 py-0.2 rounded-[3px] font-medium">
                          review
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="mt-0.5 truncate text-[11px] text-[var(--color-ink-muted)]">{tx.description}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-[var(--color-ink-faint)] tabular-nums">
                      {formatDate(tx.occurred_at)}
                      {pm ? <span className="mx-1">·</span> : null}
                      {pm?.name}
                      {pm && tx.source ? <span className="mx-1">·</span> : null}
                      <span className="capitalize">{tx.source}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      isExpense ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                    }`}
                  >
                    {isExpense ? '- ' : '+ '}
                    {formatRp(tx.amount)}
                  </span>
                </div>
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t border-[var(--color-border)] pt-2.5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(tx)
                      setShowForm(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDeletingId(tx.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="hidden md:block mobile-table-scroll bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                <th className="px-4 py-2.5 w-8">
                  <button
                    type="button"
                    aria-label="Pilih semua di halaman"
                    onClick={toggleSelectAll}
                    className={`flex h-4.5 w-4.5 items-center justify-center rounded-[4px] border transition-colors cursor-pointer ${
                      filteredTxs.every((t) => selectedIds.has(t.id)) && filteredTxs.length > 0
                        ? 'border-[var(--color-focus)] bg-[var(--color-focus)] text-[var(--color-btn-primary-text)]'
                        : 'border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] text-transparent'
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Kategori</th>
                <th className="text-left px-4 py-2.5">Metode</th>
                <th className="text-left px-4 py-2.5">Sumber</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredTxs.map((tx) => {
                const cat = catMap[tx.category_id]
                const pm = pmMap[tx.payment_method_id]
                const isExpense = tx.type === 'expense'
                return (
                  <tr key={tx.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label="Pilih transaksi"
                        onClick={() => toggleSelect(tx.id)}
                        className={`flex h-4.5 w-4.5 items-center justify-center rounded-[4px] border transition-colors cursor-pointer ${
                          selectedIds.has(tx.id)
                            ? 'border-[var(--color-focus)] bg-[var(--color-focus)] text-[var(--color-btn-primary-text)]'
                            : 'border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] text-transparent'
                        }`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap tabular-nums">
                      {formatDate(tx.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink)]">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.description ?? <span className="text-[var(--color-ink-faint)]">-</span>}</span>
                        {tx.needs_review && (
                          <span className="text-[10px] bg-[var(--color-warning-soft)] text-[var(--color-warning)] px-1.5 py-0.2 rounded-[3px] font-medium">
                            review
                          </span>
                        )}
                      </div>
                    </td>
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
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">{pm?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)] capitalize">{tx.source}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        isExpense ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                      }`}
                    >
                      {isExpense ? '- ' : '+ '}
                      {formatRp(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(tx)
                            setShowForm(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeletingId(tx.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {transactionPage.count > 0 && (
        <Pagination
          totalItems={transactionPage.count}
          pageSize={pageSize}
          page={page}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          label="transaksi"
        />
      )}

      {showForm && (
        <TransactionForm
          existing={editing ?? undefined}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Hapus Transaksi"
        message="Transaksi ini akan dipindahkan ke menu Terhapus. Anda dapat memulihkannya sewaktu-waktu."
        confirmLabel="Hapus Transaksi"
        onConfirm={() => {
          if (deletingId) deleteMutation.mutate(deletingId)
        }}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}