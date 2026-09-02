import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { RecurringInterval } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { FilterBar } from '../components/FilterBar'
import { Pagination, type PageSize } from '../components/Pagination'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { Field, Input } from '../components/Form'
import { CategorySymbolIcon, CreditCardIcon } from '../components/Icons'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import { formatDateShort, formatRp, type SortOrder } from '../utils'

const INTERVAL_OPTIONS: SelectOption[] = [
  { value: 'day:3', label: 'Per 3 hari' },
  { value: 'week:1', label: 'Per minggu' },
  { value: 'week:2', label: 'Per 2 minggu' },
  { value: 'month:1', label: 'Per bulan' },
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'completed', label: 'Target tercapai' },
]

function intervalLabel(interval: RecurringInterval, steps: number): string {
  if (interval === 'day') return `Per ${steps} hari`
  if (interval === 'week') return steps === 1 ? 'Per minggu' : `Per ${steps} minggu`
  return steps === 1 ? 'Per bulan' : `Per ${steps} bulan`
}

export function Recurring() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState<SortOrder | ''>('')
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(0)

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.recurring.list(),
  })
  const { data: categories = [], isError: isCategoriesError, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: pms = [], isError: isPmError, refetch: refetchPm } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p]))
  const filteredItems = items
    .filter((item) => {
      if (statusFilter === 'active') return item.is_active
      if (statusFilter === 'inactive') return !item.is_active
      if (statusFilter === 'completed') return item.target_count !== null && item.times_generated >= item.target_count
      return true
    })
    .slice()
    .sort((a, b) => {
      if (!sort) return 0
      if (sort === 'most' || sort === 'least') {
        const difference = parseFloat(a.amount) - parseFloat(b.amount)
        return sort === 'most' ? -difference : difference
      }
      const aDate = a.next_due_at ? new Date(a.next_due_at).getTime() : Number.POSITIVE_INFINITY
      const bDate = b.next_due_at ? new Date(b.next_due_at).getTime() : Number.POSITIVE_INFINITY
      return sort === 'oldest' ? aDate - bDate : bDate - aDate
    })
  const recurringTotalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const recurringPage = Math.min(page, recurringTotalPages - 1)
  const visibleItems = pageSize === 'all'
    ? filteredItems
    : filteredItems.slice(recurringPage * pageSize, (recurringPage + 1) * pageSize)

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.recurring.update(id, { is_active }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      success(data?.is_active ? 'Tagihan diaktifkan' : 'Tagihan dinonaktifkan')
    },
    onError: (err) => toastError((err as Error).message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.recurring.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      success('Jadwal tagihan rutin berhasil dihapus')
      setDeletingId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  const dueInfo = (iso?: Date | string | null) => {
    if (!iso) return null
    const due = new Date(iso)
    if (isNaN(due.getTime())) return null
    const today = new Date()
    const ms = due.getTime() - today.getTime()
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000))
    if (days < 0) return { label: `Terlewat ${Math.abs(days)} hari`, tone: 'overdue' as const }
    if (days === 0) return { label: 'Jatuh tempo hari ini', tone: 'overdue' as const }
    if (days === 1) return { label: 'Jatuh tempo besok', tone: 'soon' as const }
    if (days <= 7) return { label: `Jatuh tempo ${days} hari lagi`, tone: 'soon' as const }
    return null
  }

  const dueBadge = (info: { label: string; tone: 'overdue' | 'soon' } | null) => {
    if (!info) return null
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${
          info.tone === 'overdue'
            ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
            : 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
        }`}
      >
        {info.label}
      </span>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Tagihan Berulang</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Auto-generate transaksi tiap tanggal yang ditentukan setiap bulan
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          + Tambah Tagihan
        </Button>
      </div>

      <FilterBar
        preset="all"
        onPresetChange={() => undefined}
        showPeriod={false}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(0)
        }}
        statusOptions={STATUS_OPTIONS}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(0)
        }}
        onReset={() => {
          setStatusFilter('')
          setSort('')
          setPage(0)
        }}
      />

      {isLoading && <ListSkeleton rows={pageSize === 'all' ? 6 : Number(pageSize)} />}
      {!isLoading && (isError || isCategoriesError || isPmError) && (
        <ErrorState
          title="Gagal memuat data"
          description="Terjadi kesalahan saat mengambil data tagihan rutin. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchCategories()
            refetchPm()
          }}
        />
      )}
      {!isLoading && !isError && !isCategoriesError && !isPmError && items.length === 0 && (
        <EmptyState
          title="Belum ada jadwal tagihan"
          description="Tambahkan tagihan rutin untuk mengatur pembayaran otomatis."
          actionLabel="Tambah Tagihan"
          onAction={() => setShowForm(true)}
        />
      )}

      {!isLoading && !isError && !isCategoriesError && !isPmError && items.length > 0 && filteredItems.length === 0 && (
        <EmptyState
          title="Tidak ada tagihan sesuai filter"
          description="Coba ubah status atau urutan daftar."
        />
      )}

      <div className="flex flex-col gap-2.5">
        {visibleItems.map((item) => {
          const cat = catMap[item.category_id]
          const isExpense = item.type === 'expense'
          const progress = item.target_count === null
            ? null
            : Math.min(100, (item.times_generated / item.target_count) * 100)
          return (
            <div
              key={item.id}
              className={`bg-[var(--color-surface-raised)] border rounded-[10px] p-4 flex flex-col items-stretch gap-3 transition-opacity shadow-xs sm:flex-row sm:items-center ${
                item.is_active ? 'border-[var(--color-border)]' : 'border-[var(--color-border)]/60 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                    <CategorySymbolIcon name={cat?.name} size={14} className="text-[var(--color-ink-muted)]" />
                    <span>{item.description}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${
                      isExpense
                        ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
                        : 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                    }`}
                  >
                    {isExpense ? 'Pengeluaran' : 'Pemasukan'}
                  </span>
                  {!item.is_active && (
                    <span className="text-[10px] text-[var(--color-ink-faint)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 rounded-[4px]">
                      Nonaktif
                    </span>
                  )}
                  {item.is_active && dueBadge(dueInfo(item.next_due_at))}
                </div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                  {intervalLabel(item.interval, item.interval_steps)}
                  {item.interval === 'month' ? ` tanggal ${item.day_of_month}` : ''} · {cat ? cat.name : '-'} ·{' '}
                  {pmMap[item.payment_method_id]?.name ?? '-'}
                  {item.next_due_at ? ` · berikutnya ${formatDateShort(item.next_due_at)}` : ''}
                </div>
                <div className="mt-2 max-w-md">
                  {progress === null ? (
                    <span className="text-[11px] text-[var(--color-ink-faint)]">
                      Sudah dibayar {item.times_generated} kali
                    </span>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--color-ink-faint)]">
                        <span>Pembayaran</span>
                        <span className="tabular-nums">{item.times_generated}/{item.target_count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-[2px] bg-[var(--color-surface-sunken)]">
                        <div
                          className="h-full rounded-[2px] bg-[var(--color-positive)] transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <span
                className={`text-left font-semibold text-xs tabular-nums sm:text-right ${
                  isExpense ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                }`}
              >
                {isExpense ? '- ' : '+ '}
                {formatRp(item.amount)}
              </span>

              <div className="flex w-full gap-1.5 sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => toggleMut.mutate({ id: item.id, is_active: !item.is_active })}
                >
                  {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeletingId(item.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length > 0 && (
        <Pagination
          totalItems={filteredItems.length}
          pageSize={pageSize}
          page={recurringPage}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          label="tagihan"
        />
      )}

      {showForm && (
        <RecurringForm categories={categories} pms={pms} onClose={() => setShowForm(false)} />
      )}

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Hapus Tagihan Berulang"
        message="Jadwal tagihan rutin ini akan dihapus permanen. Transaksi yang sudah pernah dibuat tidak akan terhapus."
        confirmLabel="Hapus Tagihan"
        onConfirm={() => {
          if (deletingId) deleteMut.mutate(deletingId)
        }}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}

function RecurringForm({
  categories,
  pms,
  onClose,
}: {
  categories: Array<{ id: string; name: string; icon: string | null; type: string }>
  pms: Array<{ id: string; name: string }>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState({
    type: 'expense',
    category_id: '',
    payment_method_id: '',
    amount: '',
    description: '',
    interval: 'month' as RecurringInterval,
    interval_steps: '1',
    day_of_month: '1',
    target_count: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const filtered = categories.filter((c) => c.type === form.type)

  const mut = useMutation({
    mutationFn: () =>
      api.recurring.create({
        type: form.type as 'expense' | 'income',
        category_id: form.category_id,
        payment_method_id: form.payment_method_id,
        amount: parseFloat(form.amount),
        description: form.description,
        interval: form.interval,
        interval_steps: parseInt(form.interval_steps),
        day_of_month: parseInt(form.day_of_month),
        target_count: form.target_count ? parseInt(form.target_count) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      success('Jadwal tagihan rutin berhasil ditambahkan')
      onClose()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  const typeOptions: SelectOption[] = [
    { value: 'expense', label: 'Pengeluaran', badge: 'Keluar', badgeColor: 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]' },
    { value: 'income', label: 'Pemasukan', badge: 'Masuk', badgeColor: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]' },
  ]

  const categoryOptions: SelectOption[] = filtered.map((c) => ({
    value: c.id,
    label: c.name,
    icon: <CategorySymbolIcon name={c.name} size={14} />,
  }))

  const pmOptions: SelectOption[] = pms.map((p) => ({
    value: p.id,
    label: p.name,
    icon: <CreditCardIcon size={14} />,
  }))

  return (
    <Modal title="Tambah Tagihan Berulang" onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.category_id || !form.payment_method_id || !form.description || !form.amount) return
          mut.mutate()
        }}
      >
        <Field label="Tipe">
          <CustomSelect
            value={form.type}
            onChange={(v) => {
              set('type', v)
              set('category_id', '')
            }}
            options={typeOptions}
          />
        </Field>

        <Field label="Nama Tagihan">
          <Input
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="WiFi Indihome, Kost, Netflix..."
            className="!py-2"
          />
        </Field>

        <Field label="Jumlah (Rp)">
          <Input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="350000"
            className="!py-2"
          />
        </Field>

        <Field label="Interval Pembayaran">
          <CustomSelect
            value={`${form.interval}:${form.interval_steps}`}
            onChange={(value) => {
              const [interval, steps] = value.split(':')
              setForm((current) => ({
                ...current,
                interval: interval as RecurringInterval,
                interval_steps: steps ?? '1',
              }))
            }}
            options={INTERVAL_OPTIONS}
          />
        </Field>

        {form.interval === 'month' && (
          <Field label="Tanggal Eksekusi Tiap Bulan (1–28)">
            <Input
              type="number"
              min="1"
              max="28"
              required
              value={form.day_of_month}
              onChange={(e) => set('day_of_month', e.target.value)}
              className="!py-2"
            />
          </Field>
        )}

        <Field label="Target Pembayaran (opsional)">
          <Input
            type="number"
            min="1"
            max="100000"
            value={form.target_count}
            onChange={(e) => set('target_count', e.target.value)}
            placeholder="Contoh: 12 kali"
            className="!py-2"
          />
        </Field>

        <Field label="Kategori">
          <CustomSelect
            value={form.category_id}
            onChange={(v) => set('category_id', v)}
            options={categoryOptions}
            placeholder="Pilih kategori..."
            searchable
          />
        </Field>

        <Field label="Metode Pembayaran">
          <CustomSelect
            value={form.payment_method_id}
            onChange={(v) => set('payment_method_id', v)}
            options={pmOptions}
            placeholder="Pilih metode bayar..."
          />
        </Field>

        {mut.isError && <p className="text-[var(--color-negative)] text-xs">{(mut.error as Error).message}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={mut.isPending || !form.category_id || !form.payment_method_id || !form.description || !form.amount}
          >
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}