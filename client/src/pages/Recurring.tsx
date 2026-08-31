import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { Field, Input } from '../components/Form'
import { CategorySymbolIcon, CreditCardIcon } from '../components/Icons'
import { Modal } from '../components/Modal'
import { useToast } from '../components/useToast'
import { formatRp } from '../utils'

export function Recurring() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.recurring.list(),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: pms = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p]))

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

      {isLoading && <p className="text-xs text-[var(--color-ink-faint)]">Memuat data...</p>}
      {!isLoading && items.length === 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-8 text-center shadow-xs">
          <p className="text-xs text-[var(--color-ink-muted)]">Belum ada jadwal tagihan rutin.</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const cat = catMap[item.category_id]
          const isExpense = item.type === 'expense'
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
                </div>
                <div className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                  Tanggal {item.day_of_month} tiap bulan · {cat ? cat.name : '-'} ·{' '}
                  {pmMap[item.payment_method_id]?.name ?? '-'}
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
    day_of_month: '1',
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
        day_of_month: parseInt(form.day_of_month),
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