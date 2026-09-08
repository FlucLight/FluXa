import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { Pagination, type PageSize } from '../components/Pagination'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { CurrencyInput, Field } from '../components/Form'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '../components/Icons'
import { CategoryIcon } from '../components/CategoryIcon'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import { formatRp, fromLocalDateInput, getWitaDateParts } from '../utils'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const MONTH_OPTIONS: SelectOption[] = MONTH_NAMES.map((name, idx) => ({
  value: String(idx + 1),
  label: name,
}))

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function Budgets() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const now = new Date()
  const witaToday = getWitaDateParts(now)
  const currentMonth = witaToday.month
  const currentYear = witaToday.year

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<{ id: string; category_name: string; limit_amount: string } | null>(null)
  const [editingLimit, setEditingLimit] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(0)

  // Calculate date range for the selected month & year
  const daysInSelectedMonth = getDaysInMonth(selectedYear, selectedMonth)
  const monthPad = String(selectedMonth).padStart(2, '0')
  const fromIso = fromLocalDateInput(`${selectedYear}-${monthPad}-01`)
  const toIso = fromLocalDateInput(`${selectedYear}-${monthPad}-${String(daysInSelectedMonth).padStart(2, '0')}`, true)

  const isCurrentMonthView = selectedMonth === currentMonth && selectedYear === currentYear

  const { data: budgets = [], isLoading: budgetsLoading, isError, refetch } = useQuery({
    queryKey: ['budgets', selectedMonth, selectedYear],
    queryFn: () => api.budgets.list(selectedMonth, selectedYear),
  })
  const { data: txs = [], isError: isTxsError, refetch: refetchTxs } = useQuery({
    queryKey: ['transactions', { from: fromIso, to: toIso }],
    queryFn: () => api.transactions.list({ from: fromIso, to: toIso }),
  })
  const { data: categories = [], isError: isCategoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const invalidateBudgets = () => {
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['summary-balances'] })
  }

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.budgets.remove(id),
    onSuccess: () => {
      invalidateBudgets()
      success('Batas budget berhasil dihapus', 'Budget Dihapus')
      setDeletingId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  const updateLimitMut = useMutation({
    mutationFn: () => {
      if (!editingBudget) throw new Error('Budget tidak dipilih')
      return api.budgets.update(editingBudget.id, parseFloat(editingLimit) || 0)
    },
    onSuccess: () => {
      invalidateBudgets()
      setEditingBudget(null)
      success('Batas budget berhasil diperbarui', 'Budget Diperbarui')
    },
    onError: (err) => toastError((err as Error).message, 'Gagal Menyimpan'),
  })

  // Calculations
  const budgetsWithSpend = budgets.map((b) => {
    const spent = txs
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const limit = parseFloat(b.limit_amount) || 0
    const pct = limit > 0 ? (spent / limit) * 100 : 0
    const remaining = limit - spent
    return { ...b, spent, limit, pct, remaining }
  })

  const totalLimit = budgetsWithSpend.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgetsWithSpend.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalLimit - totalSpent
  const overallPct = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0

  const budgetTotalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(budgetsWithSpend.length / pageSize))
  const budgetPage = Math.min(page, budgetTotalPages - 1)
  const visibleBudgets = pageSize === 'all'
    ? budgetsWithSpend
    : budgetsWithSpend.slice(budgetPage * pageSize, (budgetPage + 1) * pageSize)

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
    setPage(0)
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
    setPage(0)
  }

  const handleResetCurrentMonth = () => {
    setSelectedMonth(currentMonth)
    setSelectedYear(currentYear)
    setPage(0)
  }

  const yearOptions: SelectOption[] = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map((y) => ({
    value: String(y),
    label: String(y),
  }))

  const deletingBudgetObj = budgetsWithSpend.find((b) => b.id === deletingId)

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] font-display">
            Budget Bulanan & Arsip
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            Atur limit pengeluaran per kategori dan pantau riwayat pencapaian budget bulan lalu.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)} className="shrink-0 w-full sm:w-auto !py-2 !px-3.5">
          + Set Budget Kategori
        </Button>
      </div>

      {/* Month & Year Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" onClick={handlePrevMonth} aria-label="Bulan sebelumnya" className="!p-2">
            <ChevronLeftIcon size={14} />
          </Button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-bold text-[var(--color-ink)] font-display">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            {isCurrentMonthView ? (
              <span className="rounded-full bg-[var(--color-focus)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-focus)]">
                Bulan Ini
              </span>
            ) : (
              <span className="rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-muted)]">
                Arsip
              </span>
            )}
          </div>

          <Button variant="secondary" onClick={handleNextMonth} aria-label="Bulan berikutnya" className="!p-2">
            <ChevronRightIcon size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentMonthView && (
            <Button variant="ghost" onClick={handleResetCurrentMonth} className="text-xs !text-[var(--color-focus)]">
              Ke Bulan Sekarang
            </Button>
          )}

          <div className="w-32">
            <CustomSelect
              value={String(selectedMonth)}
              onChange={(val) => {
                setSelectedMonth(parseInt(val, 10))
                setPage(0)
              }}
              options={MONTH_OPTIONS}
            />
          </div>

          <div className="w-24">
            <CustomSelect
              value={String(selectedYear)}
              onChange={(val) => {
                setSelectedYear(parseInt(val, 10))
                setPage(0)
              }}
              options={yearOptions}
            />
          </div>
        </div>
      </div>

      {/* Monthly Budget Summary Banner */}
      {!budgetsLoading && !isError && budgetsWithSpend.length > 0 && (
        <section className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
                Ringkasan Budget {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-[var(--color-ink)]">
                  {formatRp(totalSpent)}
                </span>
                <span className="text-xs text-[var(--color-ink-muted)] tabular-nums">
                  dari limit {formatRp(totalLimit)}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                  totalSpent > totalLimit
                    ? 'bg-[var(--color-negative)]/10 text-[var(--color-negative)] border border-[var(--color-negative)]/20'
                    : totalSpent / totalLimit > 0.8
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-[var(--color-positive)]/10 text-[var(--color-positive)] border border-[var(--color-positive)]/20'
                }`}
              >
                {totalSpent > totalLimit
                  ? `Overbudget +${formatRp(Math.abs(totalRemaining))}`
                  : `Hemat (Sisa ${formatRp(totalRemaining)})`}
              </span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] mb-1">
              <span>Penggunaan Budget</span>
              <span className="font-semibold tabular-nums">{overallPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalSpent > totalLimit
                    ? 'bg-[var(--color-negative)]'
                    : totalSpent / totalLimit > 0.8
                    ? 'bg-amber-500'
                    : 'bg-[var(--color-positive)]'
                }`}
                style={{ width: `${Math.min(100, overallPct)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Loading Skeleton */}
      {budgetsLoading && <ListSkeleton rows={4} />}

      {/* Error State */}
      {!budgetsLoading && (isError || isTxsError || isCategoriesError) && (
        <ErrorState
          title="Gagal memuat data budget"
          description="Terjadi kesalahan saat mengambil data budget. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchTxs()
            refetchCategories()
          }}
        />
      )}

      {/* Empty State */}
      {!budgetsLoading && !isError && !isTxsError && !isCategoriesError && budgetsWithSpend.length === 0 && (
        <EmptyState
          title={`Belum ada target budget di ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
          description="Atur batas maksimal pengeluaran per kategori untuk mengontrol pengeluaran di bulan ini."
        />
      )}

      {/* Budget Categories Grid */}
      {!budgetsLoading && !isError && !isTxsError && !isCategoriesError && budgetsWithSpend.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {visibleBudgets.map((b) => {
              const cat = catMap[b.category_id]
              const isOver = b.spent > b.limit
              const isWarning = !isOver && b.pct >= 80

              return (
                <section
                  key={b.id}
                  className="flex flex-col justify-between rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-xs card-hover transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink)]">
                          <CategoryIcon name={cat?.name} size={15} />
                        </span>
                        <h2 className="truncate text-sm font-bold text-[var(--color-ink)] font-display">
                          {cat?.name ?? 'Kategori'}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingBudget({ id: b.id, category_name: cat?.name ?? 'Kategori', limit_amount: String(b.limit) })
                            setEditingLimit(String(b.limit))
                          }}
                          aria-label={`Edit limit ${cat?.name}`}
                          className="!p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                        >
                          <PencilIcon size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setDeletingId(b.id)}
                          aria-label={`Hapus budget ${cat?.name}`}
                          className="!p-1.5 text-[var(--color-negative)]/80 hover:text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)]"
                        >
                          <TrashIcon size={13} />
                        </Button>
                      </div>
                    </div>

                    {/* Spend vs Limit */}
                    <div className="mt-3.5 flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-[var(--color-ink-faint)] tracking-wider">Terpakai</span>
                        <p className={`text-base font-bold tabular-nums ${isOver ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
                          {formatRp(b.spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-[var(--color-ink-faint)] tracking-wider">Limit Budget</span>
                        <p className="text-base font-semibold tabular-nums text-[var(--color-ink)]">
                          {formatRp(b.limit)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/50">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver
                              ? 'bg-[var(--color-negative)]'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-[var(--color-positive)]'
                          }`}
                          style={{ width: `${Math.min(100, b.pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status footer */}
                  <div className="mt-3 flex items-center justify-between text-[11px] border-t border-[var(--color-border)]/40 pt-2 text-[var(--color-ink-muted)] tabular-nums">
                    <span>
                      {isOver
                        ? `Melebihi limit ${formatRp(b.spent - b.limit)}`
                        : `Sisa budget ${formatRp(b.remaining)}`}
                    </span>
                    <span className={`font-semibold ${isOver ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
                      {Math.round(b.pct)}%
                    </span>
                  </div>
                </section>
              )
            })}
          </div>

          <Pagination
            totalItems={budgetsWithSpend.length}
            pageSize={pageSize}
            page={budgetPage}
            onPageSizeChange={setPageSize}
            onPageChange={setPage}
            label="kategori budget"
          />
        </div>
      )}

      {/* Add Budget Modal */}
      {showForm && (
        <BudgetFormModal
          categories={categories}
          existingIds={budgets.map((b) => b.category_id)}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            invalidateBudgets()
          }}
        />
      )}

      {/* Edit Budget Limit Modal */}
      {editingBudget && (
        <Modal
          title={`Ubah Limit Budget — ${editingBudget.category_name}`}
          onClose={() => setEditingBudget(null)}
        >
          <form
            className="flex flex-col gap-3.5"
            onSubmit={(e) => {
              e.preventDefault()
              updateLimitMut.mutate()
            }}
          >
            <Field label="Batas Maksimal Bulanan">
              <CurrencyInput
                required
                value={editingLimit}
                onChange={setEditingLimit}
                placeholder="500.000"
                className="!py-2"
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-3">
              <Button variant="secondary" onClick={() => setEditingBudget(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={updateLimitMut.isPending}>
                {updateLimitMut.isPending ? 'Menyimpan...' : 'Simpan Limit'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Hapus Batas Budget"
        message={`Apakah Anda yakin ingin menghapus batas budget untuk kategori "${deletingBudgetObj ? catMap[deletingBudgetObj.category_id]?.name : ''}" di bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}?`}
        confirmLabel="Hapus Budget"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (deletingId) deleteMut.mutate(deletingId)
        }}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}

function BudgetFormModal({
  categories,
  existingIds,
  month,
  year,
  onClose,
  onSuccess,
}: {
  categories: Array<{ id: string; name: string; type: string }>
  existingIds: string[]
  month: number
  year: number
  onClose: () => void
  onSuccess: () => void
}) {
  const { success, error: toastError } = useToast()

  const available = categories.filter((c) => c.type === 'expense' && !existingIds.includes(c.id))
  const [form, setForm] = useState({
    category_id: available[0]?.id ?? '',
    limit_amount: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: () =>
      api.budgets.create({
        category_id: form.category_id,
        month,
        year,
        limit_amount: parseFloat(form.limit_amount),
      }),
    onSuccess: () => {
      success(`Batas budget ${MONTH_NAMES[month - 1]} ${year} berhasil disimpan`, 'Budget Disimpan')
      onSuccess()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  const categoryOptions: SelectOption[] = available.map((c) => ({
    value: c.id,
    label: c.name,
    icon: <CategoryIcon name={c.name} size={14} />,
  }))

  return (
    <Modal title={`Set Budget Kategori — ${MONTH_NAMES[month - 1]} ${year}`} onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.category_id || !form.limit_amount) return
          mut.mutate()
        }}
      >
        <Field label="Kategori Pengeluaran">
          {available.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)] py-2">
              Semua kategori pengeluaran sudah memiliki batas budget di bulan ini.
            </p>
          ) : (
            <CustomSelect
              value={form.category_id}
              onChange={(v) => set('category_id', v)}
              options={categoryOptions}
              placeholder="Pilih kategori..."
            />
          )}
        </Field>

        <Field label="Batas Maksimal Bulanan">
          <CurrencyInput
            required
            value={form.limit_amount}
            onChange={(val) => set('limit_amount', val)}
            placeholder="500.000"
            className="!py-2"
            autoFocus
          />
        </Field>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={mut.isPending || !form.category_id || !form.limit_amount || available.length === 0}
          >
            {mut.isPending ? 'Menyimpan...' : 'Simpan Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
