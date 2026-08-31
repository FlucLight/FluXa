import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import { Button } from '../components/Button'
import { Field, Input, Select } from '../components/Form'
import { Modal } from '../components/Modal'
import { formatRp, getPresetDateRange } from '../utils'

export function Budgets() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const { from, to } = getPresetDateRange('this_month')

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: () => api.budgets.list(month, year),
  })
  const { data: txs = [] } = useQuery({
    queryKey: ['transactions', { from, to }],
    queryFn: () => api.transactions.list({ from: from ?? '', to: to ?? '' }),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.budgets.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const budgetsWithSpend = budgets.map((b) => {
    const spent = txs
      .filter((t) => t.category_id === b.category_id && t.type === 'expense')
      .reduce((s, t) => s + parseFloat(t.amount), 0)
    const pct = parseFloat(b.limit_amount) > 0 ? (spent / parseFloat(b.limit_amount)) * 100 : 0
    return { ...b, spent, pct }
  })

  return (
    <div className="p-8 flex flex-col gap-5 flex-1 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1C1F] tracking-tight">
            Budget Bulanan
          </h1>
          <p className="text-xs text-[#5A5C61] mt-0.5">
            Periode {now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Set Budget Kategori
        </Button>
      </div>

      {budgetsWithSpend.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-8 text-center">
          <p className="text-xs text-[#5A5C61]">Belum ada limit budget yang diatur bulan ini.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {budgetsWithSpend.map((b) => {
          const cat = catMap[b.category_id]
          const isOver = b.pct >= 100
          const isNear = b.pct >= 80 && !isOver
          const barColor = isOver
            ? 'bg-[#B23A3A]'
            : isNear
            ? 'bg-[#A9782E]'
            : 'bg-[#2E7D5B]'
          const badgeBg = isOver
            ? 'bg-[#F5E5E4] text-[#B23A3A]'
            : isNear
            ? 'bg-[#F1E7D6] text-[#A9782E]'
            : 'bg-[#E4EFE9] text-[#2E7D5B]'

          return (
            <div
              key={b.id}
              className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#1B1C1F] flex items-center gap-1.5">
                  <span>{cat?.icon}</span>
                  <span>{cat?.name ?? b.category_id}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${badgeBg}`}>
                    {b.pct.toFixed(0)}%
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Hapus budget ini?')) deleteMut.mutate(b.id)
                    }}
                    className="!px-1.5 !py-0.5 text-xs text-[#8B8D92] hover:text-[#B23A3A]"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="w-full h-2 bg-[#ECECE9] rounded-[3px] overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-[3px] transition-all`}
                  style={{ width: `${Math.min(100, b.pct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#5A5C61] tabular-nums">
                <span>Terpakai {formatRp(b.spent)}</span>
                <span className="text-[#8B8D92]">Limit {formatRp(b.limit_amount)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <BudgetForm
          categories={categories.filter((c) => c.type === 'expense')}
          existingIds={budgets.map((b) => b.category_id)}
          month={month}
          year={year}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function BudgetForm({
  categories,
  existingIds,
  month,
  year,
  onClose,
}: {
  categories: Array<{ id: string; name: string; icon: string | null }>
  existingIds: string[]
  month: number
  year: number
  onClose: () => void
}) {
  const qc = useQueryClient()
  const available = categories.filter((c) => !existingIds.includes(c.id))
  const [form, setForm] = useState({
    category_id: available[0]?.id ?? '',
    limit_amount: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: () =>
      api.budgets.create({
        category_id: form.category_id,
        month,
        year,
        limit_amount: parseFloat(form.limit_amount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] })
      onClose()
    },
  })

  return (
    <Modal title="Set Limit Budget Kategori" onClose={onClose}>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault()
          mut.mutate()
        }}
      >
        <Field label="Kategori Pengeluaran">
          <Select
            required
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Batas Maksimal Bulanan (Rp)">
          <Input
            type="number"
            min="1"
            required
            value={form.limit_amount}
            onChange={(e) => set('limit_amount', e.target.value)}
            placeholder="500000"
          />
        </Field>
        {mut.isError && <p className="text-[#B23A3A] text-xs">{(mut.error as Error).message}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#DADAD6]">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={mut.isPending || available.length === 0}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}