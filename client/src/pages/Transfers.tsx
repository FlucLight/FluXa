import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { CategoryIcon } from '../components/CategoryIcon'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { FilterBar } from '../components/FilterBar'
import { Pagination, type PageSize } from '../components/Pagination'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { DateTimePicker } from '../components/DatePicker'
import { CurrencyInput, Field, Input } from '../components/Form'
import { BankIcon, CreditCardIcon, WalletIcon } from '../components/Icons'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import {
  formatDate,
  formatRp,
  fromLocalDateInput,
  getPresetDateRange,
  type PeriodPreset,
  type SortOrder,
  fromLocalDateTimeInput,
  toLocalDateTimeInput,
} from '../utils'

type TransferTab = 'internal' | 'external'

export function Transfers() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<TransferTab>('internal')
  const [showForm, setShowForm] = useState(false)
  const [initialFormMode, setInitialFormMode] = useState<'internal' | 'external'>('internal')
  const [deletingInternalId, setDeletingInternalId] = useState<string | null>(null)
  const [deletingExternalId, setDeletingExternalId] = useState<string | null>(null)

  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sort, setSort] = useState<SortOrder | ''>('')
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [page, setPage] = useState(0)

  const dateRange =
    preset === 'custom'
      ? {
          from: customFrom ? fromLocalDateInput(customFrom) : undefined,
          to: customTo ? fromLocalDateInput(customTo, true) : undefined,
        }
      : getPresetDateRange(preset)

  const transferParams: Record<string, string> = {}
  if (dateRange.from) transferParams['from'] = dateRange.from
  if (dateRange.to) transferParams['to'] = dateRange.to
  if (sort) transferParams['sort'] = sort
  if (pageSize === 'all') transferParams['limit'] = 'all'
  else {
    transferParams['limit'] = String(pageSize)
    transferParams['offset'] = String(page * pageSize)
  }

  // 1. Data Transfer Antar Akun Sendiri (Internal)
  const { data: internalPage = { rows: [], count: 0 }, isLoading: isInternalLoading, isError: isInternalError, refetch: refetchInternal } = useQuery({
    queryKey: ['transfers', transferParams],
    queryFn: () => api.transfers.listWithCount(transferParams),
    enabled: activeTab === 'internal',
  })
  const internalTransfers = internalPage.rows

  // 2. Data Transfer ke Orang Lain (External Transactions)
  const { data: externalPage = { rows: [], count: 0 }, isLoading: isExternalLoading, isError: isExternalError, refetch: refetchExternal } = useQuery({
    queryKey: ['transactions', 'external-transfers', transferParams],
    queryFn: () => api.transactions.listWithCount({ ...transferParams, search: 'Transfer ke' }),
    enabled: activeTab === 'external',
  })
  const externalTransfers = externalPage.rows

  const { data: pms = [], isError: isPmError, refetch: refetchPm } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p]))

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list('expense'),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const deleteInternalMut = useMutation({
    mutationFn: (id: string) => api.transfers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      success('Catatan transfer antar akun berhasil dihapus', 'Transfer Dihapus')
      setDeletingInternalId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingInternalId(null)
    },
  })

  const deleteExternalMut = useMutation({
    mutationFn: (id: string) => api.transactions.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['recent-transactions'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      success('Catatan transfer ke orang lain berhasil dihapus', 'Transfer Dihapus')
      setDeletingExternalId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingExternalId(null)
    },
  })

  const isLoading = activeTab === 'internal' ? isInternalLoading : isExternalLoading
  const isError = (activeTab === 'internal' ? isInternalError : isExternalError) || isPmError

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)] font-display">Transfer Dana</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Pindah dana antar rekening sendiri atau kirim uang ke rekening orang lain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setInitialFormMode(activeTab)
              setShowForm(true)
            }}
            className="w-full sm:w-auto !py-2 !px-3.5"
          >
            + Transfer Baru
          </Button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-[var(--color-border)] gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('internal')
            setPage(0)
          }}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'internal'
              ? 'border-[var(--color-focus)] text-[var(--color-focus)]'
              : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          Antar Rekening Sendiri
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('external')
            setPage(0)
          }}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'external'
              ? 'border-[var(--color-focus)] text-[var(--color-focus)]'
              : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          Ke Rekening Orang Lain (Tampil di Dashboard)
        </button>
      </div>

      {/* Filter Bar */}
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
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(0)
        }}
        showPeriod
        onReset={() => {
          setPreset('this_month')
          setCustomFrom('')
          setCustomTo('')
          setSort('')
          setPage(0)
        }}
      />

      {/* Info Banner */}
      <div className="rounded-[8px] bg-[var(--color-surface-sunken)] p-3 border border-[var(--color-border)]/60 text-xs text-[var(--color-ink-muted)] leading-relaxed">
        {activeTab === 'internal' ? (
          <span>
            <strong>Transfer Antar Rekening Sendiri:</strong> Memindahkan dana antar rekening/dompet pribadi (mis. tarik tunai ATM atau top up e-wallet sendiri). Saldo akun berpindah namun total kekayaan bersih tetap seimbang.
          </span>
        ) : (
          <span>
            <strong>Transfer ke Orang Lain:</strong> Mencatat transfer keluar / kirim uang ke rekening atau e-wallet orang lain. Otomatis dicatat sebagai pengeluaran (*expense*), mengurangi saldo akun pengirim, dan <strong>langsung muncul di Dashboard</strong>.
          </span>
        )}
      </div>

      {isLoading && <ListSkeleton rows={pageSize === 'all' ? 6 : Number(pageSize)} />}
      {!isLoading && isError && (
        <ErrorState
          title="Gagal memuat data transfer"
          description="Terjadi kesalahan saat mengambil data transfer. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            if (activeTab === 'internal') refetchInternal()
            else refetchExternal()
            refetchPm()
          }}
        />
      )}

      {/* 1. Tabel Antar Rekening Sendiri */}
      {activeTab === 'internal' && !isLoading && !isError && (
        <>
          {internalTransfers.length === 0 ? (
            <EmptyState
              title="Belum ada transfer antar akun sendiri"
              description="Pindahkan saldo antar rekening atau e-wallet pribadi untuk melihat catatannya di sini."
              actionLabel="Transfer Baru"
              onAction={() => {
                setInitialFormMode('internal')
                setShowForm(true)
              }}
            />
          ) : (
            <>
              <p className="text-[11px] text-[var(--color-ink-faint)] md:hidden">Geser tabel ke samping untuk melihat kolom lainnya.</p>
              <div className="mobile-table-scroll bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                      <th className="text-left px-4 py-2.5">Tanggal</th>
                      <th className="text-left px-4 py-2.5">Dari Akun (Sumber)</th>
                      <th className="text-left px-4 py-2.5">Ke Akun (Tujuan)</th>
                      <th className="text-left px-4 py-2.5">Catatan</th>
                      <th className="text-right px-4 py-2.5">Jumlah</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {internalTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--color-surface)] transition-colors">
                        <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap tabular-nums">
                          {formatDate(t.occurred_at)}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                          {pmMap[t.from_payment_method_id]?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                          {pmMap[t.to_payment_method_id]?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-ink-muted)]">{t.description ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)] tabular-nums">
                          {formatRp(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="danger"
                            onClick={() => setDeletingInternalId(t.id)}
                          >
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {internalPage.count > 0 && (
                <Pagination
                  totalItems={internalPage.count}
                  pageSize={pageSize}
                  page={page}
                  onPageSizeChange={setPageSize}
                  onPageChange={setPage}
                  label="transfer antar akun"
                />
              )}
            </>
          )}
        </>
      )}

      {/* 2. Tabel Transfer ke Rekening Orang Lain */}
      {activeTab === 'external' && !isLoading && !isError && (
        <>
          {externalTransfers.length === 0 ? (
            <EmptyState
              title="Belum ada transfer ke rekening orang lain"
              description="Catat transfer ke rekening teman, keluarga, atau pembayaran pihak ketiga untuk melihatnya di sini."
              actionLabel="+ Transfer ke Orang Lain"
              onAction={() => {
                setInitialFormMode('external')
                setShowForm(true)
              }}
            />
          ) : (
            <>
              <p className="text-[11px] text-[var(--color-ink-faint)] md:hidden">Geser tabel ke samping untuk melihat kolom lainnya.</p>
              <div className="mobile-table-scroll bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                      <th className="text-left px-4 py-2.5">Tanggal</th>
                      <th className="text-left px-4 py-2.5">Dari Akun (Sumber)</th>
                      <th className="text-left px-4 py-2.5">Tujuan / Penerima &amp; Rekening</th>
                      <th className="text-left px-4 py-2.5">Kategori</th>
                      <th className="text-right px-4 py-2.5">Jumlah Transfer</th>
                      <th className="px-4 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {externalTransfers.map((tx: TransactionRecord) => {
                      const cat = catMap[tx.category_id]
                      const pm = pmMap[tx.payment_method_id]

                      return (
                        <tr key={tx.id} className="hover:bg-[var(--color-surface)] transition-colors">
                          <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap tabular-nums">
                            {formatDate(tx.occurred_at)}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                            {pm?.name ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-ink)] font-semibold">
                            {tx.description ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                            {cat ? (
                              <span className="inline-flex items-center gap-1.5 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] px-2 py-0.5 rounded-[4px]">
                                <CategoryIcon name={cat.name} size={12} />
                                <span>{cat.name}</span>
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[var(--color-negative)] tabular-nums">
                            - {formatRp(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="danger"
                              onClick={() => setDeletingExternalId(tx.id)}
                            >
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {externalPage.count > 0 && (
                <Pagination
                  totalItems={externalPage.count}
                  pageSize={pageSize}
                  page={page}
                  onPageSizeChange={setPageSize}
                  onPageChange={setPage}
                  label="transfer keluar"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <TransferForm
          initialMode={initialFormMode}
          pms={pms}
          categories={categories}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Confirm Delete Internal Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingInternalId)}
        title="Hapus Transfer Antar Akun"
        message="Riwayat transfer ini akan dihapus dari catatan perpindahan saldo internal."
        confirmLabel="Hapus Transfer"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (deletingInternalId) deleteInternalMut.mutate(deletingInternalId)
        }}
        onCancel={() => setDeletingInternalId(null)}
        isLoading={deleteInternalMut.isPending}
      />

      {/* Confirm Delete External Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingExternalId)}
        title="Hapus Transfer ke Orang Lain"
        message="Transaksi transfer ini akan dihapus dan saldo akun pengirim akan dipulihkan kembali."
        confirmLabel="Hapus Transaksi"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (deletingExternalId) deleteExternalMut.mutate(deletingExternalId)
        }}
        onCancel={() => setDeletingExternalId(null)}
        isLoading={deleteExternalMut.isPending}
      />
    </div>
  )
}

function TransferForm({
  initialMode,
  pms,
  categories,
  onClose,
}: {
  initialMode: 'internal' | 'external'
  pms: Array<{ id: string; name: string; type?: string }>
  categories: Array<{ id: string; name: string; type: string }>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [mode, setMode] = useState<'internal' | 'external'>(initialMode)

  // Default transfer category jika ada
  const defaultTransferCat = categories.find((c) => c.name.toLowerCase().includes('transfer')) ?? categories[0]

  const [form, setForm] = useState({
    from: pms[0]?.id ?? '',
    to: pms[1]?.id ?? '',
    amount: '',
    description: '',
    occurred_at: toLocalDateTimeInput(),
    // Field khusus transfer ke orang lain
    recipientName: '',
    targetBank: '',
    targetAccountNo: '',
    category_id: defaultTransferCat?.id ?? '',
    notes: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['transfers'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['recent-transactions'] })
    qc.invalidateQueries({ queryKey: ['summary-balances'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
  }

  // Mutasi 1: Transfer Antar Rekening Sendiri (Internal)
  const internalMut = useMutation({
    mutationFn: () =>
      api.transfers.create({
        from_payment_method_id: form.from,
        to_payment_method_id: form.to,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        occurred_at: fromLocalDateTimeInput(form.occurred_at),
      }),
    onSuccess: () => {
      invalidateAll()
      success('Transfer antar akun sendiri berhasil dicatat', 'Transfer Berhasil')
      onClose()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  // Mutasi 2: Transfer ke Orang Lain (External -> Masuk Transaksi Expense & Dashboard)
  const externalMut = useMutation({
    mutationFn: () => {
      const recipient = form.recipientName.trim()
      const bank = form.targetBank.trim()
      const acc = form.targetAccountNo.trim()
      const notes = form.notes.trim()

      const composedDescription = `Transfer ke ${recipient} (${bank}${acc ? ` - ${acc}` : ''})${notes ? ` · ${notes}` : ''}`

      return api.transactions.create({
        type: 'expense',
        amount: parseFloat(form.amount),
        payment_method_id: form.from,
        category_id: form.category_id || (defaultTransferCat?.id ?? categories[0]!.id),
        description: composedDescription,
        occurred_at: fromLocalDateTimeInput(form.occurred_at),
        source: 'web',
        needs_review: false,
      })
    },
    onSuccess: () => {
      invalidateAll()
      success(
        `Transfer ke ${form.recipientName} (${formatRp(form.amount)}) berhasil dicatat dan muncul di Dashboard`,
        'Transfer Keluar Berhasil',
      )
      onClose()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  const getPmIcon = (type?: string) => {
    if (type === 'bank') return <BankIcon size={14} />
    if (type === 'ewallet') return <CreditCardIcon size={14} />
    return <WalletIcon size={14} />
  }

  const fromOptions: SelectOption[] = pms.map((p) => ({
    value: p.id,
    label: p.name,
    icon: getPmIcon(p.type),
    badge: p.type,
  }))

  const toOptions: SelectOption[] = pms
    .filter((p) => p.id !== form.from)
    .map((p) => ({
      value: p.id,
      label: p.name,
      icon: getPmIcon(p.type),
      badge: p.type,
    }))

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: <CategoryIcon name={c.name} size={14} />,
  }))

  const isPending = internalMut.isPending || externalMut.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'internal') {
      if (!form.from || !form.to || !form.amount) return
      internalMut.mutate()
    } else {
      if (!form.from || !form.recipientName.trim() || !form.targetBank.trim() || !form.amount) return
      externalMut.mutate()
    }
  }

  return (
    <Modal title="Catat Transfer Dana" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Toggle Mode Transfer */}
        <div className="flex rounded-[8px] bg-[var(--color-surface-sunken)] p-1 border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setMode('internal')}
            className={`flex-1 rounded-[6px] py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'internal'
                ? 'bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Antar Rekening Sendiri
          </button>
          <button
            type="button"
            onClick={() => setMode('external')}
            className={`flex-1 rounded-[6px] py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'external'
                ? 'bg-[var(--color-surface-raised)] text-[var(--color-focus)] shadow-xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Ke Rekening Orang Lain
          </button>
        </div>

        {/* 1. Mode Internal Transfer */}
        {mode === 'internal' && (
          <>
            <Field label="Dari Akun (Sumber Dana)">
              <CustomSelect
                value={form.from}
                onChange={(v) => {
                  set('from', v)
                  if (form.to === v) set('to', '')
                }}
                options={fromOptions}
                placeholder="Pilih akun asal..."
              />
            </Field>

            <Field label="Ke Akun (Tujuan)">
              <CustomSelect
                value={form.to}
                onChange={(v) => set('to', v)}
                options={toOptions}
                placeholder="Pilih akun tujuan..."
                disabled={!form.from}
              />
            </Field>

            <Field label="Jumlah Transfer">
              <CurrencyInput
                required
                value={form.amount}
                onChange={(val) => set('amount', val)}
                placeholder="50.000"
                className="!py-2"
                autoFocus
              />
            </Field>

            <Field label="Catatan / Keterangan (Opsional)">
              <Input
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="mis. Tarik tunai ATM, Top up ShopeePay"
                className="!py-2"
              />
            </Field>
          </>
        )}

        {/* 2. Mode External Transfer (Ke Orang Lain) */}
        {mode === 'external' && (
          <>
            <div className="rounded-[6px] bg-[var(--color-focus)]/5 border border-[var(--color-focus)]/20 p-2.5 text-[11px] text-[var(--color-ink)] leading-relaxed">
              Transfer ke orang lain otomatis tercatat sebagai <strong>pengeluaran</strong>, memotong saldo akun pengirim, dan <strong>tampil di Dashboard</strong>.
            </div>

            <Field label="Dari Akun (Sumber Dana)">
              <CustomSelect
                value={form.from}
                onChange={(v) => set('from', v)}
                options={fromOptions}
                placeholder="Pilih akun pengirim..."
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nama Penerima">
                <Input
                  required
                  value={form.recipientName}
                  onChange={(e) => set('recipientName', e.target.value)}
                  placeholder="mis. Budi Santoso, Toko Buku"
                  className="!py-2"
                  autoFocus
                />
              </Field>

              <Field label="Bank / E-Wallet Penerima">
                <Input
                  required
                  value={form.targetBank}
                  onChange={(e) => set('targetBank', e.target.value)}
                  placeholder="mis. BCA, Mandiri, DANA, GoPay"
                  className="!py-2"
                />
              </Field>
            </div>

            <Field label="Nomor Rekening / No. HP Tujuan (Opsional)">
              <Input
                value={form.targetAccountNo}
                onChange={(e) => set('targetAccountNo', e.target.value)}
                placeholder="mis. 1234567890 / 08123456789"
                className="!py-2"
              />
            </Field>

            <Field label="Jumlah Transfer">
              <CurrencyInput
                required
                value={form.amount}
                onChange={(val) => set('amount', val)}
                placeholder="100.000"
                className="!py-2"
              />
            </Field>

            <Field label="Kategori Pengeluaran">
              <CustomSelect
                value={form.category_id}
                onChange={(v) => set('category_id', v)}
                options={categoryOptions}
                placeholder="Pilih kategori..."
              />
            </Field>

            <Field label="Catatan / Keperluan (Opsional)">
              <Input
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="mis. Bayar hutang, Patungan makan, Hadiah ultah"
                className="!py-2"
              />
            </Field>
          </>
        )}

        <Field label="Tanggal & Waktu">
          <DateTimePicker
            value={form.occurred_at}
            onChange={(v) => set('occurred_at', v)}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Menyimpan...'
              : mode === 'internal'
              ? 'Simpan Transfer Internal'
              : 'Simpan Transfer ke Orang Lain'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
