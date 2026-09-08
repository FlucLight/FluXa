import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from './Button'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { DateTimePicker } from './DatePicker'
import { CurrencyInput, Field, Textarea } from './Form'
import { CategoryIcon } from './CategoryIcon'
import { BankIcon, CreditCardIcon, WalletIcon } from './Icons'
import { Modal } from './Modal'
import { useToast } from './useToast'
import { fromLocalDateTimeInput, toLocalDateTimeInput } from '../utils'

type Props = { existing?: TransactionRecord; onClose: () => void }

export function TransactionForm({ existing, onClose }: Props) {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

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
    image_url: existing?.image_url ?? '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleReceiptUpload(file: File | undefined) {
    if (!file) return
    setUploadingReceipt(true)
    try {
      const res = await api.transactions.uploadReceipt(file)
      set('image_url', res.url)
      success('Foto struk/bukti berhasil diunggah', 'Upload Selesai')
    } catch (err) {
      toastError((err as Error).message, 'Gagal Upload Foto')
    } finally {
      setUploadingReceipt(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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
        image_url: form.image_url || null,
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
      success(existing ? 'Perubahan transaksi disimpan' : 'Transaksi baru berhasil disimpan', 'Berhasil Disimpan')
      onClose()
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menyimpan')
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

  const getPmIcon = (type: string) => {
    if (type === 'bank') return <BankIcon size={14} />
    if (type === 'ewallet') return <CreditCardIcon size={14} />
    return <WalletIcon size={14} />
  }

  const pmOptions: SelectOption[] = paymentMethods.map((p) => ({
    value: p.id,
    label: p.name,
    icon: getPmIcon(p.type),
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

        <Field label="Jumlah Nominal">
          <CurrencyInput
            required
            value={form.amount}
            onChange={(val) => set('amount', val)}
            placeholder="15.000"
            className="!py-2"
            autoFocus={!existing}
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

        <Field label="Foto Struk / Bukti Transaksi (Opsional)">
          {form.image_url ? (
            <div className="flex items-center gap-3 p-2.5 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <img
                  src={form.image_url}
                  alt="Struk transaksi"
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => window.open(form.image_url, '_blank')}
                  title="Klik untuk melihat foto penuh"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-xs font-semibold text-[var(--color-ink)] truncate">
                  Foto struk terlampir
                </span>
                <span className="text-[11px] text-[var(--color-ink-faint)]">
                  Klik foto untuk melihat ukuran penuh
                </span>
                <button
                  type="button"
                  onClick={() => set('image_url', '')}
                  className="mt-0.5 self-start text-[11px] font-semibold text-[var(--color-negative)] hover:underline cursor-pointer"
                >
                  Hapus Foto
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="receipt-upload"
                onChange={(e) => handleReceiptUpload(e.target.files?.[0])}
              />
              <Button
                variant="secondary"
                type="button"
                className="w-full sm:w-auto !py-2"
                disabled={uploadingReceipt}
                onClick={() => fileRef.current?.click()}
              >
                {uploadingReceipt ? 'Mengunggah Foto…' : '+ Pilih Foto Struk / Bukti'}
              </Button>
              <span className="text-[11px] text-[var(--color-ink-faint)]">
                Format: JPG, PNG, WEBP (maks. 10MB)
              </span>
            </div>
          )}
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