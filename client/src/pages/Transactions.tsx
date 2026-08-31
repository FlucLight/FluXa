import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Form'
import { TransactionForm } from '../components/TransactionForm'
import {
  formatDate,
  formatRp,
  getPresetDateRange,
  PRESET_OPTIONS,
  type PeriodPreset,
} from '../utils'

export function Transactions() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TransactionRecord | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pmFilter, setPmFilter] = useState('')
  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')

  const dateRange =
    preset === 'custom'
      ? {
          from: customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : undefined,
          to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : undefined,
        }
      : getPresetDateRange(preset)

  const params: Record<string, string> = {}
  if (typeFilter) params['type'] = typeFilter
  if (categoryFilter) params['category_id'] = categoryFilter
  if (pmFilter) params['payment_method_id'] = pmFilter
  if (dateRange.from) params['from'] = dateRange.from
  if (dateRange.to) params['to'] = dateRange.to

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.transactions.list(params),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const pmMap = Object.fromEntries(paymentMethods.map((p) => [p.id, p]))

  const filteredTxs = txs.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const desc = (t.description ?? '').toLowerCase()
    const catName = (catMap[t.category_id]?.name ?? '').toLowerCase()
    const pmName = (pmMap[t.payment_method_id]?.name ?? '').toLowerCase()
    const raw = (t.raw_input ?? '').toLowerCase()
    return desc.includes(q) || catName.includes(q) || pmName.includes(q) || raw.includes(q)
  })

  const totalFilteredExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalFilteredIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1C1F] tracking-tight">Daftar Transaksi</h1>
          <p className="text-xs text-[#5A5C61] mt-0.5">
            Filter lengkap per hari, minggu, bulan, kategori, dan metode pembayaran
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
        >
          + Catat Transaksi
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <Select
            value={preset}
            onChange={(e) => setPreset(e.target.value as PeriodPreset)}
            className="!bg-[#ECECE9]"
          >
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="!bg-[#ECECE9]"
          >
            <option value="">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="!bg-[#ECECE9]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name} ({c.type === 'expense' ? 'Keluar' : 'Masuk'})
              </option>
            ))}
          </Select>

          <Select
            value={pmFilter}
            onChange={(e) => setPmFilter(e.target.value)}
            className="!bg-[#ECECE9]"
          >
            <option value="">Semua Metode</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </Select>

          <Input
            type="text"
            placeholder="Cari deskripsi / teks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!bg-[#ECECE9]"
          />
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#DADAD6]">
            <span className="text-xs text-[#5A5C61]">Dari tanggal:</span>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-36 !bg-[#ECECE9]"
            />
            <span className="text-xs text-[#8B8D92]">s/d</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-36 !bg-[#ECECE9]"
            />
          </div>
        )}

        {/* Mini Summary of Filtered View */}
        <div className="flex items-center justify-between text-xs text-[#5A5C61] pt-1 border-t border-[#DADAD6]">
          <span>
            Menampilkan <b>{filteredTxs.length}</b> transaksi
          </span>
          <div className="flex items-center gap-4 tabular-nums font-semibold">
            <span className="text-[#2E7D5B]">Masuk: +{formatRp(totalFilteredIncome)}</span>
            <span className="text-[#B23A3A]">Keluar: -{formatRp(totalFilteredExpense)}</span>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-xs text-[#8B8D92]">Memuat transaksi...</p>}

      {!isLoading && filteredTxs.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-8 text-center">
          <p className="text-xs text-[#5A5C61]">Tidak ada transaksi yang cocok dengan filter.</p>
        </div>
      )}

      {filteredTxs.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#DADAD6] bg-[#ECECE9] text-[#5A5C61] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Kategori</th>
                <th className="text-left px-4 py-2.5">Metode</th>
                <th className="text-left px-4 py-2.5">Sumber</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADAD6]">
              {filteredTxs.map((tx) => {
                const cat = catMap[tx.category_id]
                const pm = pmMap[tx.payment_method_id]
                const isExpense = tx.type === 'expense'
                return (
                  <tr key={tx.id} className="hover:bg-[#F5F5F3] transition-colors">
                    <td className="px-4 py-3 text-[#5A5C61] whitespace-nowrap tabular-nums">
                      {formatDate(tx.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[#1B1C1F]">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.description ?? <span className="text-[#8B8D92]">-</span>}</span>
                        {tx.needs_review && (
                          <span className="text-[10px] bg-[#F1E7D6] text-[#A9782E] px-1.5 py-0.2 rounded-[3px] font-medium">
                            review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#5A5C61]">
                      {cat ? (
                        <span className="inline-flex items-center gap-1 bg-[#ECECE9] text-[#1B1C1F] px-2 py-0.5 rounded-[4px]">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#5A5C61]">{pm?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-[#8B8D92] capitalize">{tx.source}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        isExpense ? 'text-[#B23A3A]' : 'text-[#2E7D5B]'
                      }`}
                    >
                      {isExpense ? '- ' : '+ '}
                      {formatRp(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(tx)
                            setShowForm(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirm('Hapus transaksi ini?')) deleteMutation.mutate(tx.id)
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TransactionForm
          existing={editing ?? undefined}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}