import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TransactionRecord } from 'shared'
import { api } from '../api'
import { Button } from '../components/Button'
import { FilterBar } from '../components/FilterBar'
import { TransactionForm } from '../components/TransactionForm'
import {
  formatDate,
  formatRp,
  getPresetDateRange,
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

  const handleReset = () => {
    setPreset('this_month')
    setCustomFrom('')
    setCustomTo('')
    setTypeFilter('')
    setCategoryFilter('')
    setPmFilter('')
    setSearch('')
  }

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
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Daftar Transaksi</h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Kelola, telusuri, dan saring seluruh transaksi Anda
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

      <FilterBar
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        categories={categories}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        paymentMethods={paymentMethods}
        selectedPm={pmFilter}
        onPmChange={setPmFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        search={search}
        onSearchChange={setSearch}
        onReset={handleReset}
      />

      <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)] px-1">
        <span>
          Menampilkan <b>{filteredTxs.length}</b> dari {txs.length} transaksi
        </span>
        <div className="flex items-center gap-4 tabular-nums font-semibold">
          <span className="text-[var(--color-positive)]">Total Masuk: +{formatRp(totalFilteredIncome)}</span>
          <span className="text-[var(--color-negative)]">Total Keluar: -{formatRp(totalFilteredExpense)}</span>
        </div>
      </div>

      {isLoading && <p className="text-xs text-[var(--color-ink-faint)]">Memuat transaksi...</p>}

      {!isLoading && filteredTxs.length === 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-8 text-center shadow-xs">
          <p className="text-xs text-[var(--color-ink-muted)]">Tidak ada transaksi yang cocok dengan filter.</p>
        </div>
      )}

      {filteredTxs.length > 0 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] font-medium">
                <th className="text-left px-4 py-2.5">Tanggal</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Kategori</th>
                <th className="text-left px-4 py-2.5">Metode</th>
                <th className="text-left px-4 py-2.5">Sumber</th>
                <th className="text-right px-4 py-2.5">Jumlah</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredTxs.map((tx) => {
                const cat = catMap[tx.category_id]
                const pm = pmMap[tx.payment_method_id]
                const isExpense = tx.type === 'expense'
                return (
                  <tr key={tx.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-ink-muted)] whitespace-nowrap tabular-nums">
                      {formatDate(tx.occurred_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink)]">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.description ?? <span className="text-[var(--color-ink-faint)]">-</span>}</span>
                        {tx.needs_review && (
                          <span className="text-[10px] bg-[var(--color-warning-soft)] text-[var(--color-warning)] px-1.5 py-0.2 rounded-[3px] font-medium">
                            review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {cat ? (
                        <span className="inline-flex items-center gap-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] px-2 py-0.5 rounded-[4px]">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">{pm?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)] capitalize">{tx.source}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        isExpense ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
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