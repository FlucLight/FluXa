import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { Field, Input, Select } from '../components/Form'
import { Modal } from '../components/Modal'
import { formatRp } from '../utils'

export function Recurring() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
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
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p.name]))

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.recurring.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.recurring.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Tagihan Berulang</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Auto-generate transaksi tiap tanggal yang ditentukan setiap bulan
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
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
              className={`bg-[var(--color-surface-raised)] border rounded-[10px] p-4 flex items-center gap-4 transition-opacity shadow-xs ${
                item.is_active ? 'border-[var(--color-border)]' : 'border-[var(--color-border)]/60 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[var(--color-ink)]">{item.description}</span>
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
                  Tanggal {item.day_of_month} tiap bulan · {cat ? `${cat.icon} ${cat.name}` : '-'} ·{' '}
                  {pmMap[item.payment_method_id] ?? '-'}
                </div>
              </div>

              <span
                className={`font-semibold text-xs tabular-nums ${
                  isExpense ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                }`}
              >
                {isExpense ? '- ' : '+ '}
                {formatRp(item.amount)}
              </span>

              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  onClick={() => toggleMut.mutate({ id: item.id, is_active: !item.is_active })}
                >
                  {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Hapus tagihan ini?')) deleteMut.mutate(item.id)
                  }}
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
      onClose()
    },
  })

  return (
    <Modal title="Tambah Tagihan Berulang" onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          mut.mutate()
        }}
      >
        <Field label="Tipe">
          <Select
            value={form.type}
            onChange={(e) => {
              set('type', e.target.value)
              set('category_id', '')
            }}
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </Select>
        </Field>
        <Field label="Nama Tagihan">
          <Input
            required
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="WiFi Indihome, Kost, Netflix..."
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
          />
        </Field>
        <Field label="Kategori">
          <Select
            required
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Metode Pembayaran">
          <Select
            required
            value={form.payment_method_id}
            onChange={(e) => set('payment_method_id', e.target.value)}
          >
            <option value="">Pilih metode</option>
            {pms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal Eksekusi (1–28)">
          <Input
            type="number"
            min="1"
            max="28"
            required
            value={form.day_of_month}
            onChange={(e) => set('day_of_month', e.target.value)}
          />
        </Field>
        {mut.isError && <p className="text-[var(--color-negative)] text-xs">{(mut.error as Error).message}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}