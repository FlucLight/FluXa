import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { CustomSelect, type SelectOption } from '../components/CustomSelect'
import { DateTimePicker } from '../components/DatePicker'
import { Field, Input } from '../components/Form'
import { CreditCardIcon } from '../components/Icons'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { formatDate, formatRp } from '../utils'

export function Transfers() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.transfers.list(),
  })
  const { data: pms = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const pmMap = Object.fromEntries(pms.map((p) => [p.id, p.name]))

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.transfers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      success('Riwayat transfer berhasil dihapus')
      setDeletingId(null)
    },
    onError: (err) => {
      toastError((err as Error).message, 'Gagal Menghapus')
      setDeletingId(null)
    },
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Transfer Dana</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Perpindahan uang antar akun/dompet (tidak mempengaruhi total income/expense)
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Transfer Baru
        </Button>
      </div>

      {isLoading && <p className="text-xs text-[var(--color-ink-faint)]">Memuat data...</p>}
      {!isLoading && transfers.length === 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-8 text-center shadow-xs">
          <p className="text-xs text-[var(--color-ink-muted)]">Belum ada riwayat transfer.</p>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] overflow-hidden shadow-xs">
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
    occurred_at: new Date().toISOString().slice(0, 16),
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: () =>
      api.transfers.create({
        from_payment_method_id: form.from,
        to_payment_method_id: form.to,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        occurred_at: new Date(form.occurred_at).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
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