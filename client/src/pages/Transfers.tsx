import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { EmptyState, ErrorState, ListSkeleton } from '../components/ListStates'
import { FilterBar } from '../components/FilterBar'
import { Pagination, type PageSize } from '../components/Pagination'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { DateTimePicker } from '../components/DatePicker'
import { Field, Input } from '../components/Form'
import { CreditCardIcon } from '../components/Icons'
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

export function Transfers() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const { data: transferPage = { rows: [], count: 0 }, isLoading, isError, refetch } = useQuery({
    queryKey: ['transfers', transferParams],
    queryFn: () => api.transfers.listWithCount(transferParams),
  })
  const transfers = transferPage.rows
  const { data: pms = [], isError: isPmError, refetch: refetchPm } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p.name]))

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.transfers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      success('Riwayat transfer berhasil dihapus')
      setDeletingId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  return (
    <div className="w-full min-w-0 max-w-5xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Transfer Dana</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Perpindahan uang antar akun/dompet (tidak mempengaruhi total income/expense)
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          + Transfer Baru
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

      {isLoading && <ListSkeleton rows={pageSize === 'all' ? 6 : Number(pageSize)} />}
      {!isLoading && (isError || isPmError) && (
        <ErrorState
          title="Gagal memuat data"
          description="Terjadi kesalahan saat mengambil data transfer. Periksa koneksi lalu coba lagi."
          onRetry={() => {
            refetch()
            refetchPm()
          }}
        />
      )}
      {!isLoading && !isError && !isPmError && transfers.length === 0 && (
        <EmptyState
          title="Belum ada riwayat transfer"
          description="Pindahkan saldo antar akun untuk melihat riwayatnya di sini."
          actionLabel="Transfer Baru"
          onAction={() => setShowForm(true)}
        />
      )}

      {!isError && !isPmError && transfers.length > 0 && (
        <>
        <p className="text-[11px] text-[var(--color-ink-faint)] md:hidden">Geser tabel ke samping untuk melihat kolom lainnya.</p>
        <div className="mobile-table-scroll bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Dari Akun</th>
                <th className="text-left px-4 py-2.5">Ke Akun</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--color-surface)] transition-colors">
                  <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap tabular-nums">
                    {formatDate(t.occurred_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                    {pmMap[t.from_payment_method_id] ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                    {pmMap[t.to_payment_method_id] ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-muted)]">{t.description ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)] tabular-nums">
                    {formatRp(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      onClick={() => setDeletingId(t.id)}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {transferPage.count > 0 && (
        <Pagination
          totalItems={transferPage.count}
          pageSize={pageSize}
          page={page}
          onPageSizeChange={setPageSize}
          onPageChange={setPage}
          label="transfer"
        />
      )}

      {showForm && <TransferForm pms={pms} onClose={() => setShowForm(false)} />}

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Hapus Transfer"
        message="Riwayat transfer ini akan dihapus dari catatan perpindahan dana."
        confirmLabel="Hapus Transfer"
        onConfirm={() => {
          if (deletingId) deleteMut.mutate(deletingId)
        }}
        onCancel={() => setDeletingId(null)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}

function TransferForm({
  pms,
  onClose,
}: {
  pms: Array<{ id: string; name: string; type?: string }>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState({
    from: '',
    to: '',
    amount: '',
    description: '',
    occurred_at: toLocalDateTimeInput(),
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: () =>
      api.transfers.create({
        from_payment_method_id: form.from,
        to_payment_method_id: form.to,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        occurred_at: fromLocalDateTimeInput(form.occurred_at),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      success('Transfer dana berhasil dicatat')
      onClose()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
    },
  })

  const fromOptions: SelectOption[] = pms.map((p) => ({
    value: p.id,
    label: p.name,
    icon: <CreditCardIcon size={14} />,
    badge: p.type,
  }))

  const toOptions: SelectOption[] = pms
    .filter((p) => p.id !== form.from)
    .map((p) => ({
      value: p.id,
      label: p.name,
      icon: <CreditCardIcon size={14} />,
      badge: p.type,
    }))

  return (
    <Modal title="Catat Transfer Antar Akun" onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.from || !form.to || !form.amount) return
          mut.mutate()
        }}
      >
        <Field label="Dari Akun (Sumber)">
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

        <Field label="Jumlah (Rp)">
          <Input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="50000"
            className="!py-2"
          />
        </Field>

        <Field label="Keterangan">
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="mis. Tarik tunai ATM, Top up ShopeePay"
            className="!py-2"
          />
        </Field>

        <Field label="Tanggal & Waktu">
          <DateTimePicker
            value={form.occurred_at}
            onChange={(v) => set('occurred_at', v)}
          />
        </Field>

        {mut.isError && <p className="text-[var(--color-negative)] text-xs">{(mut.error as Error).message}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={mut.isPending || !form.from || !form.to || !form.amount}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}