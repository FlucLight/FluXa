import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from './Button'
import { Field, Input, Select, Textarea } from './Form'
import { Modal } from './Modal'

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
    occurred_at: existing?.occurred_at
      ? new Date(existing.occurred_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
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
        occurred_at: new Date(form.occurred_at).toISOString(),
        source: 'web' as const,
        needs_review: false,
      }
      return existing
        ? api.transactions.update(existing.id, payload)
        : api.transactions.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      onClose()
    },
  })

  const filteredCategories = categories.filter((c) => c.type === form.type)

  return (
    <Modal title={existing ? 'Edit Transaksi' : 'Tambah Transaksi'} onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
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
            <option value="expense">Pengeluaran (Expense)</option>
            <option value="income">Pemasukan (Income)</option>
          </Select>
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
          />
        </Field>
        <Field label="Kategori">
          <Select
            required
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sumber / Metode Bayar">
          <Select
            required
            value={form.payment_method_id}
            onChange={(e) => set('payment_method_id', e.target.value)}
          >
            <option value="">Pilih metode</option>
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Keterangan">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Opsional (mis. Nasi padang siang)"
          />
        </Field>
        <Field label="Tanggal & Jam">
          <Input
            type="datetime-local"
            required
            value={form.occurred_at}
            onChange={(e) => set('occurred_at', e.target.value)}
          />
        </Field>
        {mutation.isError && (
          <p className="text-[#B23A3A] text-xs">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#DADAD6]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}