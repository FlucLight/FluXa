import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import { FilterBar } from '../components/FilterBar'
import {
  formatRp,
  getPresetDateRange,
  type PeriodPreset,
} from '../utils'

const GRAY_SHADES = ['#1B1C1F', '#3A3C42', '#5A5C61', '#7A7D84', '#9A9DA4', '#B7B7B2', '#DADAD6']

export function Dashboard() {
  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPm, setSelectedPm] = useState('')

  const dateRange =
    preset === 'custom'
      ? {
          from: customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : undefined,
          to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : undefined,
        }
      : getPresetDateRange(preset)

  const params: Record<string, string> = {}
  if (dateRange.from) params['from'] = dateRange.from
  if (dateRange.to) params['to'] = dateRange.to
  if (selectedCategory) params['category_id'] = selectedCategory
  if (selectedPm) params['payment_method_id'] = selectedPm

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
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', new Date().getMonth() + 1, new Date().getFullYear()],
    queryFn: () => api.budgets.list(new Date().getMonth() + 1, new Date().getFullYear()),
  })

  const handleReset = () => {
    setPreset('this_month')
    setCustomFrom('')
    setCustomTo('')
    setSelectedCategory('')
    setSelectedPm('')
  }

  const totalExpense = txs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalIncome = txs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const net = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.max(0, (net / totalIncome) * 100) : 0

  const expenseByCategory = categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      ...c,
      total: txs
        .filter((t) => t.category_id === c.id && t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      count: txs.filter((t) => t.category_id === c.id && t.type === 'expense').length,
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const incomeByCategory = categories
    .filter((c) => c.type === 'income')
    .map((c) => ({
      ...c,
      total: txs
        .filter((t) => t.category_id === c.id && t.type === 'income')
        .reduce((s, t) => s + parseFloat(t.amount), 0),
      count: txs.filter((t) => t.category_id === c.id && t.type === 'income').length,
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const byPaymentMethod = paymentMethods
    .map((pm) => {
      const expense = txs
        .filter((t) => t.payment_method_id === pm.id && t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      const income = txs
        .filter((t) => t.payment_method_id === pm.id && t.type === 'income')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      return { ...pm, expense, income, total: expense + income }
    })
    .filter((pm) => pm.total > 0)
    .sort((a, b) => b.total - a.total)

  const dailyMap: Record<string, { date: Date; expense: number; income: number; label: string }> = {}
  for (const t of txs) {
    const d = new Date(t.occurred_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      timeZone: 'Asia/Makassar',
    })
    if (!dailyMap[key]) dailyMap[key] = { date: d, expense: 0, income: 0, label }
    dailyMap[key]![t.type] += parseFloat(t.amount)
  }
  const dailyData = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ day: v.label, expense: v.expense, income: v.income }))

  const budgetsWithSpend = budgets
    .map((b) => {
      const spent = txs
        .filter((t) => t.category_id === b.category_id && t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      const pct = parseFloat(b.limit_amount) > 0 ? (spent / parseFloat(b.limit_amount)) * 100 : 0
      const cat = categories.find((c) => c.id === b.category_id)
      return { ...b, spent, pct, catName: cat ? `${cat.icon ?? ''} ${cat.name}` : '-' }
    })
    .filter((b) => b.spent > 0 || parseFloat(b.limit_amount) > 0)

  return (
    <div className="p-8 flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B1C1F] tracking-tight">
          Ringkasan Finansial
        </h1>
        <p className="text-xs text-[#5A5C61] mt-0.5">
          Analisis arus kas, distribusi pengeluaran, dan status budget
        </p>
      </div>

      {/* Modern Compact Filter Bar */}
      <FilterBar
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        paymentMethods={paymentMethods}
        selectedPm={selectedPm}
        onPmChange={setSelectedPm}
        onReset={handleReset}
      />

      {isLoading ? (
        <p className="text-xs text-[#8B8D92]">Memuat ringkasan data...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4">
              <span className="text-[11px] font-medium text-[#5A5C61] uppercase tracking-wider">
                ↑ Total Pemasukan
              </span>
              <p className="text-xl font-bold text-[#2E7D5B] tabular-nums mt-1 font-display">
                {formatRp(totalIncome)}
              </p>
              <p className="text-[11px] text-[#8B8D92] mt-1">
                {txs.filter((t) => t.type === 'income').length} transaksi
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4">
              <span className="text-[11px] font-medium text-[#5A5C61] uppercase tracking-wider">
                ↓ Total Pengeluaran
              </span>
              <p className="text-xl font-bold text-[#B23A3A] tabular-nums mt-1 font-display">
                {formatRp(totalExpense)}
              </p>
              <p className="text-[11px] text-[#8B8D92] mt-1">
                {txs.filter((t) => t.type === 'expense').length} transaksi
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4">
              <span className="text-[11px] font-medium text-[#5A5C61] uppercase tracking-wider">
                Saldo Bersih (Net)
              </span>
              <p
                className={`text-xl font-bold tabular-nums mt-1 font-display ${
                  net >= 0 ? 'text-[#1B1C1F]' : 'text-[#B23A3A]'
                }`}
              >
                {formatRp(net)}
              </p>
              <p className="text-[11px] text-[#8B8D92] mt-1">
                {net >= 0 ? 'Surplus anggaran' : 'Defisit anggaran'}
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-4">
              <span className="text-[11px] font-medium text-[#5A5C61] uppercase tracking-wider">
                Rasio Tabungan
              </span>
              <p className="text-xl font-bold text-[#1B1C1F] tabular-nums mt-1 font-display">
                {savingsRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#8B8D92] mt-1">dari total pemasukan</p>
            </div>
          </div>

          {dailyData.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-[#1B1C1F] uppercase tracking-wider">
                  Tren Transaksi per Periode
                </h2>
                <div className="flex items-center gap-4 text-[11px] text-[#5A5C61]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2E7D5B]" />
                    Pemasukan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-[#B23A3A]" />
                    Pengeluaran
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={dailyData} barGap={3}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#ECECE9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#8B8D92' }}
                    axisLine={{ stroke: '#DADAD6' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8B8D92' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #DADAD6',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#1B1C1F',
                    }}
                    labelStyle={{ color: '#5A5C61', fontWeight: 600, marginBottom: 4 }}
                    formatter={(v, name) => [
                      formatRp(Number(v)),
                      name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                    ]}
                  />
                  <Bar dataKey="income" fill="#2E7D5B" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="expense" fill="#B23A3A" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#1B1C1F] uppercase tracking-wider">
                  Pengeluaran per Kategori
                </h2>
                <span className="text-[11px] text-[#8B8D92]">{expenseByCategory.length} aktif</span>
              </div>

              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-[#8B8D92]">Tidak ada data pengeluaran.</p>
              ) : (
                <>
                  <div className="h-36 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={58}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        >
                          {expenseByCategory.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={GRAY_SHADES[idx % GRAY_SHADES.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#FFFFFF',
                            border: '1px solid #DADAD6',
                            borderRadius: 6,
                            fontSize: 11,
                          }}
                          formatter={(v) => [formatRp(Number(v)), 'Total']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {expenseByCategory.map((c, idx) => {
                      const pct = totalExpense > 0 ? (c.total / totalExpense) * 100 : 0
                      return (
                        <div key={c.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#1B1C1F] flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-[2px] shrink-0"
                                style={{
                                  backgroundColor: GRAY_SHADES[idx % GRAY_SHADES.length],
                                }}
                              />
                              <span>{c.icon}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-[#8B8D92]">
                                {pct.toFixed(0)}%
                              </span>
                              <span className="text-[#1B1C1F] tabular-nums font-semibold">
                                {formatRp(c.total)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-[#ECECE9] rounded-[2px] overflow-hidden">
                            <div
                              className="h-full rounded-[2px]"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                backgroundColor: GRAY_SHADES[idx % GRAY_SHADES.length],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-5 flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-[#1B1C1F] uppercase tracking-wider">
                Sumber / Metode Pembayaran
              </h2>
              {byPaymentMethod.length === 0 ? (
                <p className="text-xs text-[#8B8D92]">Tidak ada aktivitas transaksi.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {byPaymentMethod.map((pm) => (
                    <div
                      key={pm.id}
                      className="border border-[#DADAD6] rounded-[6px] p-2.5 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#1B1C1F]">
                          {pm.name}
                        </span>
                        <span className="text-[10px] bg-[#ECECE9] text-[#5A5C61] px-1.5 py-0.2 rounded-[3px] uppercase">
                          {pm.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] tabular-nums">
                        <span className="text-[#2E7D5B] font-medium">
                          +{formatRp(pm.income)}
                        </span>
                        <span className="text-[#B23A3A] font-medium">
                          -{formatRp(pm.expense)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#1B1C1F] uppercase tracking-wider">
                  Status Budget Bulan Ini
                </h2>
                <span className="text-[11px] text-[#8B8D92]">{budgetsWithSpend.length} target</span>
              </div>

              {budgetsWithSpend.length === 0 ? (
                <p className="text-xs text-[#8B8D92]">Belum ada budget yang ditentukan.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                  {budgetsWithSpend.map((b) => {
                    const isOver = b.pct >= 100
                    const isNear = b.pct >= 80 && !isOver
                    const barColor = isOver
                      ? 'bg-[#B23A3A]'
                      : isNear
                      ? 'bg-[#A9782E]'
                      : 'bg-[#2E7D5B]'
                    return (
                      <div key={b.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#1B1C1F] font-medium truncate">
                            {b.catName}
                          </span>
                          <span
                            className={`tabular-nums font-semibold text-[11px] ${
                              isOver
                                ? 'text-[#B23A3A]'
                                : isNear
                                ? 'text-[#A9782E]'
                                : 'text-[#5A5C61]'
                            }`}
                          >
                            {b.pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#ECECE9] rounded-[2px] overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-[2px]`}
                            style={{ width: `${Math.min(100, b.pct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#8B8D92] tabular-nums">
                          <span>{formatRp(b.spent)}</span>
                          <span>limit {formatRp(b.limit_amount)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {incomeByCategory.length > 0 && (
            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-5">
              <h2 className="text-xs font-semibold text-[#1B1C1F] uppercase tracking-wider mb-3">
                Sumber Pemasukan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {incomeByCategory.map((c) => (
                  <div
                    key={c.id}
                    className="border border-[#DADAD6] rounded-[6px] p-3 flex flex-col gap-1"
                  >
                    <span className="text-xs text-[#5A5C61] flex items-center gap-1">
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </span>
                    <p className="text-sm font-bold text-[#2E7D5B] tabular-nums font-display">
                      {formatRp(c.total)}
                    </p>
                    <span className="text-[11px] text-[#8B8D92]">{c.count} kali diterima</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {txs.length === 0 && (
            <div className="bg-[#FFFFFF] border border-[#DADAD6] rounded-[10px] p-8 text-center flex flex-col items-center gap-2">
              <p className="text-sm text-[#5A5C61]">Tidak ada transaksi untuk filter ini.</p>
              <p className="text-xs text-[#8B8D92]">
                Coba ubah rentang tanggal atau filter kategori di atas.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}