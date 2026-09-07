import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Area,
  AreaChart,
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
import { DashboardSkeleton } from '../components/ListStates'
import { FilterBar } from '../components/FilterBar'
import { Pagination, type PageSize } from '../components/Pagination'
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '../components/Icons'
import { CategoryIcon } from '../components/CategoryIcon'
import { useTheme } from '../components/useTheme'
import {
  categoryColor,
  formatDateShort,
  formatRp,
  fromLocalDateInput,
  getPresetDateRange,
  getWitaDateParts,
  type PeriodPreset,
} from '../utils'

type TrendChartType = 'bar' | 'line'
type TrendGranularity = 'hour' | 'day' | 'week' | 'month'

const TREND_CHART_TYPE_KEY = 'fluxa:trend-chart-type'
const WITA_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function trendGranularityFor(fromMs: number, toMs: number): TrendGranularity {
  const days = Math.ceil((toMs - fromMs) / DAY_MS)
  if (days <= 1) return 'hour'
  if (days <= 31) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

function trendBucketStart(ms: number, g: TrendGranularity): number {
  const t = ms + WITA_MS
  const d = new Date(t)
  switch (g) {
    case 'hour':
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).getTime() - WITA_MS
    case 'day':
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime() - WITA_MS
    case 'week': {
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
      return start.getTime() - WITA_MS
    }
    case 'month':
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getTime() - WITA_MS
  }
}

function trendBucketLabel(startMs: number, g: TrendGranularity, includeYear: boolean): string {
  const d = new Date(startMs + WITA_MS)
  const day = d.getUTCDate()
  const mon = d.getUTCMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (g) {
    case 'hour':
      return `${pad(d.getUTCHours())}:00`
    case 'day':
      return `${day} ${MONTH_SHORT[mon]}`
    case 'week': {
      const end = new Date(d)
      end.setUTCDate(end.getUTCDate() + 6)
      const eDay = end.getUTCDate()
      const eMon = end.getUTCMonth()
      return mon === eMon
        ? `${day}-${eDay} ${MONTH_SHORT[mon]}`
        : `${day} ${MONTH_SHORT[mon]} - ${eDay} ${MONTH_SHORT[eMon]}`
    }
    case 'month':
      return includeYear ? `${MONTH_SHORT[mon]} ${d.getUTCFullYear()}` : MONTH_SHORT[mon]
  }
}

export function Dashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const incomeColor = isDark ? '#34D399' : '#2E7D5B'
  const expenseColor = isDark ? '#F87171' : '#B23A3A'

  const [chartType, setChartType] = useState<TrendChartType>(() => {
    try {
      return localStorage.getItem(TREND_CHART_TYPE_KEY) === 'line' ? 'line' : 'bar'
    } catch {
      return 'bar'
    }
  })
  const changeChartType = (t: TrendChartType) => {
    setChartType(t)
    try {
      localStorage.setItem(TREND_CHART_TYPE_KEY, t)
    } catch {
      // ignore persistence failures (private mode, storage quota, etc.)
    }
  }

  const [preset, setPreset] = useState<PeriodPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPm, setSelectedPm] = useState('')
  const [recentPageSize, setRecentPageSize] = useState<PageSize>(5)
  const [recentPage, setRecentPage] = useState(0)
  const [monthNavOffset, setMonthNavOffset] = useState(0)

  const monthRangeISO = (offset: number) => {
    const today = getWitaDateParts()
    const start = new Date(Date.UTC(today.year, today.month - 1 + offset, 1))
    const end = new Date(Date.UTC(today.year, today.month - 1 + offset + 1, 0))
    const pad = (n: number) => String(n).padStart(2, '0')
    const startDate = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`
    const endDate = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`
    return { from: fromLocalDateInput(startDate), to: fromLocalDateInput(endDate, true) }
  }

  const monthOverride = monthNavOffset !== 0 ? monthRangeISO(monthNavOffset) : null

  const dateRange =
    monthOverride
      ? { from: monthOverride.from, to: monthOverride.to }
      : preset === 'custom'
        ? {
            from: customFrom ? fromLocalDateInput(customFrom) : undefined,
            to: customTo ? fromLocalDateInput(customTo, true) : undefined,
          }
        : getPresetDateRange(preset)

  const params: Record<string, string> = {}
  if (dateRange.from) params['from'] = dateRange.from
  if (dateRange.to) params['to'] = dateRange.to
  if (selectedCategory) params['category_id'] = selectedCategory
  if (selectedPm) params['payment_method_id'] = selectedPm

  const { data: txs = [], isLoading, isError: txsError } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.transactions.list(params),
  })
  const { data: categories = [], isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })
  const { data: paymentMethods = [], isError: pmError } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.paymentMethods.list(),
  })
  const witaToday = getWitaDateParts()
  const { data: budgets = [], isError: budgetsError } = useQuery({
    queryKey: ['budgets', witaToday.month, witaToday.year],
    queryFn: () => api.budgets.list(witaToday.month, witaToday.year),
  })
  const { data: accountBalances = [], isError: balancesError } = useQuery({
    queryKey: ['summary-balances'],
    queryFn: () => api.summary.balances(),
  })

  const recentParams = recentPageSize === 'all'
    ? { sort: 'newest', limit: 'all' as const }
    : { sort: 'newest', limit: recentPageSize, offset: recentPage * recentPageSize }

  const { data: recent = { rows: [], count: 0 }, isFetching: recentLoading } = useQuery({
    queryKey: ['recent-transactions', recentPageSize, recentPage],
    queryFn: () => api.transactions.listWithCount(recentParams),
  })

  const handleReset = () => {
    setPreset('this_month')
    setCustomFrom('')
    setCustomTo('')
    setSelectedCategory('')
    setSelectedPm('')
    setMonthNavOffset(0)
    setRecentPage(0)
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

  let trendMinMs = Infinity
  let trendMaxMs = -Infinity
  for (const t of txs) {
    const ms = new Date(t.occurred_at).getTime()
    if (ms < trendMinMs) trendMinMs = ms
    if (ms > trendMaxMs) trendMaxMs = ms
  }
  const trendFromMs = dateRange.from
    ? new Date(dateRange.from).getTime()
    : Number.isFinite(trendMinMs)
      ? trendMinMs
      : 0
  const trendToMs = dateRange.to
    ? new Date(dateRange.to).getTime()
    : Number.isFinite(trendMaxMs)
      ? trendMaxMs
      : 0
  const trendGranularity = trendGranularityFor(trendFromMs, trendToMs)
  const trendIncludeYear =
    trendGranularity === 'month' &&
    new Date(trendFromMs).getUTCFullYear() !== new Date(trendToMs).getUTCFullYear()

  const trendBuckets = new Map<number, { label: string; expense: number; income: number }>()
  {
    const step = trendGranularity === 'hour' ? 3600_000 : trendGranularity === 'day' ? DAY_MS : trendGranularity === 'week' ? 7 * DAY_MS : null
    let start = trendBucketStart(trendFromMs, trendGranularity)
    let guard = 0
    while (start <= trendToMs && guard < 400) {
      trendBuckets.set(start, {
        label: trendBucketLabel(start, trendGranularity, trendIncludeYear),
        expense: 0,
        income: 0,
      })
      if (step !== null) {
        start += step
      } else {
        const next = new Date(start + WITA_MS)
        next.setUTCMonth(next.getUTCMonth() + 1)
        start = next.getTime() - WITA_MS
      }
      guard += 1
    }
  }
  for (const t of txs) {
    const bucket = trendBuckets.get(trendBucketStart(new Date(t.occurred_at).getTime(), trendGranularity))
    if (bucket) bucket[t.type] += parseFloat(t.amount)
  }
  const trendData = [...trendBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({ day: v.label, expense: v.expense, income: v.income }))
  const trendMaxBars = trendData.length > 45 ? 5 : trendData.length > 28 ? 8 : trendData.length > 14 ? 12 : 20

  const budgetsWithSpend = budgets
    .map((b) => {
      const spent = txs
        .filter((t) => t.category_id === b.category_id && t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      const pct = parseFloat(b.limit_amount) > 0 ? (spent / parseFloat(b.limit_amount)) * 100 : 0
      const cat = categories.find((c) => c.id === b.category_id)
      return { ...b, spent, pct, catName: cat?.name ?? '-' }
    })
    .filter((b) => b.spent > 0 || parseFloat(b.limit_amount) > 0)

  return (
    <div className="w-full min-w-0 max-w-6xl animate-fade-in p-4 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">
          Ringkasan Finansial
        </h1>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
          Analisis arus kas, distribusi pengeluaran, dan status budget
        </p>
      </div>

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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthNavOffset((offset) => offset - 1)}
            aria-label="Bulan sebelumnya"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] cursor-pointer"
          >
            ‹
          </button>
          <span className="min-w-32 text-center text-xs font-semibold text-[var(--color-ink)] tabular-nums">
            {new Intl.DateTimeFormat('id-ID', {
              month: 'long',
              year: 'numeric',
              timeZone: 'Asia/Makassar',
            }).format(dateRange.from ? new Date(dateRange.from) : new Date())}
          </span>
          <button
            type="button"
            onClick={() => setMonthNavOffset((offset) => offset + 1)}
            aria-label="Bulan berikutnya"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-border-strong)] cursor-pointer"
          >
            ›
          </button>
        </div>
        {monthNavOffset !== 0 && (
          <button
            type="button"
            onClick={() => setMonthNavOffset(0)}
            className="text-[11px] font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline-offset-2 hover:underline cursor-pointer"
          >
            Kembali ke bulan ini
          </button>
        )}
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {(txsError || categoriesError || pmError || budgetsError || balancesError) && (
            <div
              role="alert"
              className="mb-3 rounded-[8px] border border-[var(--color-negative)]/40 bg-[var(--color-negative-soft)] px-3 py-2.5 text-xs text-[var(--color-ink)]"
            >
              Sebagian data tidak dapat dimuat. Periksa koneksi atau coba muat ulang halaman.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-xs card-hover">
              <span className="text-[11px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRightIcon size={12} className="text-[var(--color-positive)]" />
                <span>Total Pemasukan</span>
              </span>
              <p className="text-xl font-bold text-[var(--color-positive)] tabular-nums mt-1 font-display">
                {formatRp(totalIncome)}
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">
                {txs.filter((t) => t.type === 'income').length} transaksi
              </p>
            </div>

            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-xs card-hover">
              <span className="text-[11px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeftIcon size={12} className="text-[var(--color-negative)]" />
                <span>Total Pengeluaran</span>
              </span>
              <p className="text-xl font-bold text-[var(--color-negative)] tabular-nums mt-1 font-display">
                {formatRp(totalExpense)}
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">
                {txs.filter((t) => t.type === 'expense').length} transaksi
              </p>
            </div>

            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-xs card-hover">
              <span className="text-[11px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
                Saldo Bersih (Net)
              </span>
              <p
                className={`text-xl font-bold tabular-nums mt-1 font-display ${
                  net >= 0 ? 'text-[var(--color-ink)]' : 'text-[var(--color-negative)]'
                }`}
              >
                {formatRp(net)}
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">
                {net >= 0 ? 'Surplus anggaran' : 'Defisit anggaran'}
              </p>
            </div>

            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-4 shadow-xs card-hover">
              <span className="text-[11px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider">
                Rasio Tabungan
              </span>
              <p className="text-xl font-bold text-[var(--color-ink)] tabular-nums mt-1 font-display">
                {savingsRate.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">dari total pemasukan</p>
            </div>
           </div>

           {accountBalances.length > 0 && (
             <section className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-xs card-hover">
               <div className="mb-3 flex items-center justify-between gap-3">
                 <div>
                   <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Saldo Akun</h2>
                   <p className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">Saldo berdasarkan transaksi dan transfer aktif</p>
                 </div>
                 <span className="text-[11px] text-[var(--color-ink-faint)]">{accountBalances.length} akun</span>
               </div>
               <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                 {accountBalances.map((account) => (
                   <div key={account.id} className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                     <p className="truncate text-xs font-semibold text-[var(--color-ink)]">{account.name}</p>
                     <p className={`mt-1 text-sm font-bold tabular-nums ${account.balance < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-ink)]'}`}>
                       {formatRp(account.balance)}
                     </p>
                   </div>
                 ))}
               </div>
             </section>
           )}

           {txs.length > 0 && (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-xs card-hover">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
                  Tren Transaksi per Periode
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-4 text-[11px] text-[var(--color-ink-muted)]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-positive)]" />
                      Pemasukan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--color-negative)]" />
                      Pengeluaran
                    </span>
                  </div>
                  <div
                    className="flex items-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-0.5"
                    role="group"
                    aria-label="Tipe grafik tren"
                  >
                    <button
                      type="button"
                      aria-pressed={chartType === 'bar'}
                      title="Grafik batang"
                      onClick={() => changeChartType('bar')}
                      className={`flex h-6 w-8 items-center justify-center rounded-[4px] transition-colors cursor-pointer ${
                        chartType === 'bar'
                          ? 'bg-[var(--color-surface-raised)] text-[var(--color-focus)] shadow-xs'
                          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <rect x="1" y="7" width="3.5" height="8" rx="0.75" />
                        <rect x="6.5" y="3" width="3.5" height="12" rx="0.75" />
                        <rect x="12" y="5" width="3.5" height="10" rx="0.75" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-pressed={chartType === 'line'}
                      title="Grafik garis"
                      onClick={() => changeChartType('line')}
                      className={`flex h-6 w-8 items-center justify-center rounded-[4px] transition-colors cursor-pointer ${
                        chartType === 'line'
                          ? 'bg-[var(--color-surface-raised)] text-[var(--color-focus)] shadow-xs'
                          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12.5 L5.5 7.5 L9 10 L15 3.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={210}>
                {chartType === 'bar' ? (
                  <BarChart data={trendData} barGap={3}>
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke={isDark ? '#334155' : '#ECECE9'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#8B8D92' }}
                      axisLine={{ stroke: isDark ? '#334155' : '#DADAD6' }}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#8B8D92' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#334155' : '#DADAD6'}`,
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: isDark
                          ? '0 8px 24px rgba(0,0,0,0.45)'
                          : '0 8px 24px rgba(0,0,0,0.08)',
                        padding: '8px 10px',
                      }}
                      itemStyle={{ color: isDark ? '#E2E8F0' : '#1B1C1F' }}
                      labelStyle={{ color: isDark ? '#94A3B8' : '#5A5C61', fontWeight: 600, marginBottom: 4 }}
                      formatter={(v, name) => [
                        formatRp(Number(v)),
                        name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                      ]}
                    />
                    <Bar dataKey="income" fill={incomeColor} radius={[3, 3, 0, 0]} maxBarSize={trendMaxBars} />
                    <Bar dataKey="expense" fill={expenseColor} radius={[3, 3, 0, 0]} maxBarSize={trendMaxBars} />
                  </BarChart>
                ) : (
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGradIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={incomeColor} stopOpacity={0.32} />
                        <stop offset="95%" stopColor={incomeColor} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="trendGradExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={expenseColor} stopOpacity={0.32} />
                        <stop offset="95%" stopColor={expenseColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke={isDark ? '#334155' : '#ECECE9'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#8B8D92' }}
                      axisLine={{ stroke: isDark ? '#334155' : '#DADAD6' }}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#8B8D92' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#111827' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#334155' : '#DADAD6'}`,
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: isDark
                          ? '0 8px 24px rgba(0,0,0,0.45)'
                          : '0 8px 24px rgba(0,0,0,0.08)',
                        padding: '8px 10px',
                      }}
                      itemStyle={{ color: isDark ? '#E2E8F0' : '#1B1C1F' }}
                      labelStyle={{ color: isDark ? '#94A3B8' : '#5A5C61', fontWeight: 600, marginBottom: 4 }}
                      formatter={(v, name) => [
                        formatRp(Number(v)),
                        name === 'expense' ? 'Pengeluaran' : 'Pemasukan',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke={incomeColor}
                      strokeWidth={2}
                      fill="url(#trendGradIncome)"
                      dot={{ r: 2.5, fill: incomeColor, strokeWidth: 0 }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke={expenseColor}
                      strokeWidth={2}
                      fill="url(#trendGradExpense)"
                      dot={{ r: 2.5, fill: expenseColor, strokeWidth: 0 }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="min-w-0 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 flex flex-col gap-3 shadow-xs card-hover">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
                  Pengeluaran per Kategori
                </h2>
                <span className="text-[11px] text-[var(--color-ink-faint)]">{expenseByCategory.length} aktif</span>
              </div>

              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">Tidak ada data pengeluaran.</p>
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
                          stroke={isDark ? '#1E293B' : '#FFFFFF'}
                          strokeWidth={2}
                        >
                          {expenseByCategory.map((c, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={categoryColor(c.name, isDark)}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: isDark ? '#111827' : '#FFFFFF',
                            border: `1px solid ${isDark ? '#334155' : '#DADAD6'}`,
                            borderRadius: 8,
                            fontSize: 11,
                            boxShadow: isDark
                              ? '0 8px 24px rgba(0,0,0,0.45)'
                              : '0 8px 24px rgba(0,0,0,0.08)',
                            padding: '8px 10px',
                          }}
                          itemStyle={{ color: isDark ? '#E2E8F0' : '#1B1C1F' }}
                          labelStyle={{ color: isDark ? '#94A3B8' : '#5A5C61', fontWeight: 600, marginBottom: 4 }}
                          formatter={(v, name) => [formatRp(Number(v)), name as string]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {expenseByCategory.map((c) => {
                      const pct = totalExpense > 0 ? (c.total / totalExpense) * 100 : 0
                      return (
                        <div key={c.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--color-ink)] flex items-center gap-1.5 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: categoryColor(c.name, isDark),
                                  boxShadow: isDark
                                    ? `0 0 0 1px rgba(255,255,255,0.12)`
                                    : 'none',
                                }}
                              />
                              <CategoryIcon name={c.name} size={13} className="shrink-0" />
                              <span className="truncate">{c.name}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-[var(--color-ink-faint)]">
                                {pct.toFixed(0)}%
                              </span>
                              <span className="text-[var(--color-ink)] tabular-nums font-semibold">
                                {formatRp(c.total)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-[var(--color-surface-sunken)] rounded-[2px] overflow-hidden">
                            <div
                              className="h-full rounded-[2px] progress-fill"
                              style={{
                                width: `${Math.min(100, pct)}%`,
                                backgroundColor: categoryColor(c.name, isDark),
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

            <div className="min-w-0 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 flex flex-col gap-3 shadow-xs card-hover">
              <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
                Sumber / Metode Pembayaran
              </h2>
              {byPaymentMethod.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">Tidak ada aktivitas transaksi.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {byPaymentMethod.map((pm) => (
                    <div
                      key={pm.id}
                      className="border border-[var(--color-border)] rounded-[6px] p-2.5 flex flex-col gap-1.5 bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[var(--color-ink)]">
                          {pm.name}
                        </span>
                        <span className="text-[10px] bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] px-1.5 py-0.2 rounded-[3px] uppercase font-mono">
                          {pm.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] tabular-nums">
                        <span className="text-[var(--color-positive)] font-medium">
                          +{formatRp(pm.income)}
                        </span>
                        <span className="text-[var(--color-negative)] font-medium">
                          -{formatRp(pm.expense)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 flex flex-col gap-3 shadow-xs card-hover">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
                  Status Budget Bulan Ini
                </h2>
                <span className="text-[11px] text-[var(--color-ink-faint)]">{budgetsWithSpend.length} target</span>
              </div>

              {budgetsWithSpend.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-faint)]">Belum ada budget yang ditentukan.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                  {budgetsWithSpend.map((b) => {
                    const isOver = b.pct >= 100
                    const isNear = b.pct >= 80 && !isOver
                    const barColor = isOver
                      ? 'bg-[var(--color-negative)]'
                      : isNear
                      ? 'bg-[var(--color-warning)]'
                      : 'bg-[var(--color-positive)]'
                    return (
                      <div key={b.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-ink)] font-medium truncate flex items-center gap-1.5">
                            <CategoryIcon name={b.catName} size={13} className="shrink-0" />
                            <span className="truncate">{b.catName}</span>
                          </span>
                          <span
                            className={`tabular-nums font-semibold text-[11px] ${
                              isOver
                                ? 'text-[var(--color-negative)]'
                                : isNear
                                ? 'text-[var(--color-warning)]'
                                : 'text-[var(--color-ink-muted)]'
                            }`}
                          >
                            {b.pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--color-surface-sunken)] rounded-[2px] overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-[2px] progress-fill`}
                            style={{ width: `${Math.min(100, b.pct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--color-ink-faint)] tabular-nums">
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
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-xs card-hover">
              <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider mb-3">
                Sumber Pemasukan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {incomeByCategory.map((c) => (
                  <div
                    key={c.id}
                    className="border border-[var(--color-border)] rounded-[6px] p-3 flex flex-col gap-1 bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
                  >
                    <span className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5">
                      <CategoryIcon name={c.name} size={13} />
                      <span>{c.name}</span>
                    </span>
                    <p className="text-sm font-bold text-[var(--color-positive)] tabular-nums font-display">
                      {formatRp(c.total)}
                    </p>
                    <span className="text-[11px] text-[var(--color-ink-faint)]">{c.count} kali diterima</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <section className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-5 shadow-xs card-hover">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">
                    Transaksi Terakhir
                  </h2>
                  <p className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">
                    {recent.count} total transaksi tercatat
                  </p>
                </div>
              </div>

              {recentLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)] py-2 animate-pulse-subtle">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-focus)] animate-ping" />
                  <span>Memuat...</span>
                </div>
              )}

              <ul className="flex flex-col">
                {recent.rows.map((t, i) => {
                  const cat = categories.find((c) => c.id === t.category_id)
                  const pm = paymentMethods.find((p) => p.id === t.payment_method_id)
                  return (
                    <li
                      key={t.id}
                      className={`flex items-center gap-3 py-2.5 ${
                        i !== 0 ? 'border-t border-[var(--color-border)]' : ''
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] ${
                          t.type === 'expense'
                            ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
                            : 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                        }`}
                      >
                        {t.type === 'expense' ? (
                          <ArrowDownLeftIcon size={14} />
                        ) : (
                          <ArrowUpRightIcon size={14} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[var(--color-ink)]">
                          {cat?.name ?? 'Kategori'}
                          {t.description ? <span className="font-normal text-[var(--color-ink-faint)]"> · {t.description}</span> : null}
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-faint)]">
                          {formatDateShort(t.occurred_at)}
                          {pm ? <span className="mx-1">·</span> : null}
                          {pm?.name}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold tabular-nums ${
                          t.type === 'expense'
                            ? 'text-[var(--color-negative)]'
                            : 'text-[var(--color-positive)]'
                        }`}
                      >
                        {t.type === 'expense' ? '-' : '+'}
                        {formatRp(t.amount)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3">
                <Pagination
                  totalItems={recent.count}
                  pageSize={recentPageSize}
                  page={recentPage}
                  onPageSizeChange={setRecentPageSize}
                  onPageChange={setRecentPage}
                  label="transaksi"
                />
              </div>
            </section>

          {txs.length === 0 && (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[10px] p-8 text-center flex flex-col items-center gap-2 shadow-xs animate-fade-in">
              <p className="text-sm text-[var(--color-ink-muted)]">Tidak ada transaksi untuk filter ini.</p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                Coba ubah rentang tanggal atau filter kategori di atas.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}