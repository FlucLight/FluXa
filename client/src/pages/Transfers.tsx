import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { Field, Input, Select } from '../components/Form'
import { Modal } from '../components/Modal'
import { formatDate, formatRp } from '../utils'

export function Transfers() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1C1F] tracking-tight">Transfer Dana</h1>
          <p className="text-xs text-[#5A5C61] mt-0.5">
            Perpindahan uang antar akun/dompet (tidak mempengaruhi total income/expense)
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Transfer Baru
        </Button>
      </div>

      {isLoading && <p className="text-xs text-[#8B8D92]">Memuat data...</p>}
      {!isLoading && transfers.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-8 text-center">
          <p className="text-xs text-[#5A5C61]">Belum ada riwayat transfer.</p>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#DADAD6] bg-[#ECECE9] text-[#5A5C61] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Dari Akun</th>
                <th className="text-left px-4 py-2.5">Ke Akun</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADAD6]">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-[#F5F5F3] transition-colors">
                  <td className="px-4 py-3 text-[#5A5C61] whitespace-nowrap tabular-nums">
                    {formatDate(t.occurred_at)}
                  </td>
                  <td className="px-4 py-3 text-[#1B1C1F] font-medium">
                    {pmMap[t.from_payment_method_id] ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[#1B1C1F] font-medium">
                    {pmMap[t.to_payment_method_id] ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[#5A5C61]">{t.description ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1B1C1F] tabular-nums">
                    {formatRp(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm('Hapus transfer ini?')) deleteMut.mutate(t.id)
                      }}
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
    </div>
  )
}

function TransferForm({
  pms,
  onClose,
}: {
  pms: Array<{ id: string; name: string }>
  onClose: () => void
}) {
  const qc = useQueryClient()
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
      onClose()
    },
  })

  return (
    <Modal title="Catat Transfer Antar Akun" onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          mut.mutate()
        }}
      >
        <Field label="Dari Akun (Sumber)">
          <Select required value={form.from} onChange={(e) => set('from', e.target.value)}>
            <option value="">Pilih akun asal</option>
            {pms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ke Akun (Tujuan)">
          <Select required value={form.to} onChange={(e) => set('to', e.target.value)}>
            <option value="">Pilih akun tujuan</option>
            {pms
              .filter((p) => p.id !== form.from)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Jumlah (Rp)">
          <Input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="50000"
          />
        </Field>
        <Field label="Keterangan">
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="mis. Tarik tunai ATM, Top up ShopeePay"
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
        {mut.isError && <p className="text-[#B23A3A] text-xs">{(mut.error as Error).message}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#DADAD6]">
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