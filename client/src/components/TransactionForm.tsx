import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from './Button'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { DateTimePicker } from './DatePicker'
import { Field, Input, Textarea } from './Form'
import { CategoryIcon } from './CategoryIcon'
import { CreditCardIcon } from './Icons'
import { Modal } from './Modal'
import { fromLocalDateTimeInput, toLocalDateTimeInput } from '../utils'

type Props = { existing?: TransactionRecord; onClose: () => void }

export function TransactionForm({ existing, onClose }: Props) {
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })

  const [form, setForm] = useState({
    type: existing?.type ?? 'expense',
    amount: existing ? String(parseFloat(existing.amount)) : '',
    category_id: existing?.category_id ?? '',
    payment_method_id: existing?.payment_method_id ?? '',
    description: existing?.description ?? '',
    occurred_at: toLocalDateTimeInput(existing?.occurred_at),
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        type: form.type as 'expense' | 'income',
        amount: parseFloat(form.amount),
        category_id: form.category_id,
        payment_method_id: form.payment_method_id,
        description: form.description || null,
        occurred_at: fromLocalDateTimeInput(form.occurred_at),
        source: 'web' as const,
        needs_review: false,
      }
      return existing
        ? api.transactions.update(existing.id, payload)
        : api.transactions.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['recent-transactions'] })
      qc.invalidateQueries({ queryKey: ['summary-balances'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
      onClose()
    },
  })

  const typeOptions: SelectOption[] = [
    {
      value: 'expense',
      label: 'Pengeluaran (Expense)',
      badge: 'Keluar',
      badgeColor: 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]',
    },
    {
      value: 'income',
      label: 'Pemasukan (Income)',
      badge: 'Masuk',
      badgeColor: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
    },
  ]

  const filteredCategories = categories.filter((c) => c.type === form.type)
  const categoryOptions: SelectOption[] = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: <CategoryIcon name={c.name} size={14} />,
  }))

  const pmOptions: SelectOption[] = paymentMethods.map((p) => ({
    value: p.id,
    label: p.name,
    icon: <CreditCardIcon size={14} />,
    badge: p.type,
  }))

  return (
    <Modal title={existing ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.category_id || !form.payment_method_id || !form.amount) return
          mutation.mutate()
        }}
      >
        <Field label="Tipe Transaksi">
          <CustomSelect
            value={form.type}
            onChange={(v) => {
              set('type', v)
              set('category_id', '')
            }}
            options={typeOptions}
          />
        </Field>

        <Field label="Jumlah (Rp)">
          <Input
            type="number"
            min="1"
            step="1"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="15000"
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

        <Field label="Sumber / Metode Pembayaran">
          <CustomSelect
            value={form.payment_method_id}
            onChange={(v) => set('payment_method_id', v)}
            options={pmOptions}
            placeholder="Pilih metode bayar..."
          />
        </Field>

        <Field label="Keterangan">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Opsional (mis. Nasi padang siang, Belanja mingguan)"
          />
        </Field>

        <Field label="Tanggal & Waktu">
          <DateTimePicker
            value={form.occurred_at}
            onChange={(v) => set('occurred_at', v)}
          />
        </Field>

        {mutation.isError && (
          <p className="text-[var(--color-negative)] text-xs">{(mutation.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !form.category_id || !form.payment_method_id || !form.amount}
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}