import type {
  AccountTransferRecord,
  BudgetRecord,
  CategoryRecord,
  CreateCategoryInput,
  CreatePaymentMethodInput,
  CreateTransactionInput,
  PaymentMethodRecord,
  RecurringTransactionRecord,
  TransactionRecord,
  UpdateCategoryInput,
  UpdatePaymentMethodInput,
  UpdateTransactionInput,
} from 'shared'

const BASE = '/api'
const TIMEOUT_MS = 15000
const RETRY_COUNT = 2
type QueryValue = string | number | undefined

type QueryParams = Record<string, QueryValue>

function queryString(params?: QueryParams): string {
  if (!params) return ''
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => [key, String(value)] as [string, string])
  const qs = new URLSearchParams(entries).toString()
  return qs ? `?${qs}` : ''
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  try {
    return await fetch(BASE + path, { ...init, headers, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      const res = await rawFetch(path, init)
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      if (res.status === 204) return undefined as T
      return res.json()
    } catch (err) {
      const retriable = attempt < RETRY_COUNT && !((err as Error).name === 'AbortError')
      if (retriable) {
        attempt++
        await delay(300 * attempt)
        continue
      }
      throw err
    }
  }
}

export const api = {
  categories: {
    list: (type?: 'expense' | 'income') =>
      req<CategoryRecord[]>(`/categories${type ? `?type=${type}` : ''}`),
    create: (data: CreateCategoryInput) =>
      req<CategoryRecord>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateCategoryInput) =>
      req<CategoryRecord>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  paymentMethods: {
    list: () => req<PaymentMethodRecord[]>('/payment-methods'),
    create: (data: CreatePaymentMethodInput) =>
      req<PaymentMethodRecord>('/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdatePaymentMethodInput) =>
      req<PaymentMethodRecord>(`/payment-methods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/payment-methods/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: (params?: QueryParams) =>
      req<TransactionRecord[]>(`/transactions${queryString(params)}`),
    listWithCount: (params?: QueryParams) =>
      req<{ rows: TransactionRecord[]; count: number }>(
        `/transactions${queryString({ ...params, include_count: 'true' })}`,
      ),
    create: (data: CreateTransactionInput) =>
      req<TransactionRecord>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTransactionInput) =>
      req<TransactionRecord>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/transactions/${id}`, { method: 'DELETE' }),
    restore: (id: string) =>
      req<TransactionRecord>(`/transactions/${id}/restore`, { method: 'POST' }),
    deleted: (params?: QueryParams) =>
      req<TransactionRecord[]>(`/transactions${queryString({ ...params, deleted: 'true' })}`),
    deletedWithCount: (params?: QueryParams) =>
      req<{ rows: TransactionRecord[]; count: number }>(
        `/transactions${queryString({ ...params, deleted: 'true', include_count: 'true' })}`,
      ),
    parse: (text: string) =>
      req<ParseResult>('/transactions/parse', { method: 'POST', body: JSON.stringify({ text }) }),
    quick: (text: string, occurredAt?: string | null) =>
      req<{ transaction: TransactionRecord; parsed: ParseResult }>('/transactions/quick', {
        method: 'POST',
        body: JSON.stringify({ text, ...(occurredAt ? { occurred_at: occurredAt } : {}) }),
      }),
  },

  transfers: {
    list: (params?: QueryParams) =>
      req<AccountTransferRecord[]>(`/transfers${queryString(params)}`),
    listWithCount: (params?: QueryParams) =>
      req<{ rows: AccountTransferRecord[]; count: number }>(
        `/transfers${queryString({ ...params, include_count: 'true' })}`,
      ),
    create: (data: { from_payment_method_id: string; to_payment_method_id: string; amount: number; description?: string; occurred_at?: string }) =>
      req<AccountTransferRecord>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/transfers/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    list: (month?: number, year?: number) => {
      const qs = new URLSearchParams()
      if (month) qs.set('month', String(month))
      if (year) qs.set('year', String(year))
      return req<BudgetRecord[]>(`/budgets${qs.toString() ? '?' + qs : ''}`)
    },
    create: (data: { category_id: string; month: number; year: number; limit_amount: number }) =>
      req<BudgetRecord>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, limit_amount: number) =>
      req<BudgetRecord>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify({ limit_amount }) }),
    remove: (id: string) => req<void>(`/budgets/${id}`, { method: 'DELETE' }),
  },

  recurring: {
    list: () => req<RecurringTransactionRecord[]>('/recurring-transactions'),
    create: (data: {
      category_id: string
      payment_method_id: string
      type: 'expense' | 'income'
      amount: number
      description: string
      day_of_month: number
      interval?: 'day' | 'week' | 'month'
      interval_steps?: number
      target_count?: number | null
    }) =>
      req<RecurringTransactionRecord>('/recurring-transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{
      is_active: boolean
      amount: number
      description: string
      day_of_month: number
      interval?: 'day' | 'week' | 'month'
      interval_steps?: number
      target_count?: number | null
      category_id: string
      payment_method_id: string
      type: 'expense' | 'income'
    }>) =>
      req<RecurringTransactionRecord>(`/recurring-transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/recurring-transactions/${id}`, { method: 'DELETE' }),
  },

  summary: {
    totals: (params?: QueryParams) =>
      req<{ income: number; expense: number; net: number; transactionCount: number }>(`/summary/totals${queryString(params)}`),
    balances: () => req<Array<{ id: string; name: string; type: string; balance: number }>>('/summary/balances'),
  },

  export: {
    csv: async () => {
      const res = await fetch('/api/export/csv')
      if (!res.ok) throw new Error('Gagal mengunduh CSV')
      return res.blob()
    },
    xlsx: async () => {
      const res = await fetch('/api/export/xlsx')
      if (!res.ok) throw new Error('Gagal mengunduh Excel')
      return res.blob()
    },
    json: async () => {
      const res = await fetch('/api/export/json')
      if (!res.ok) throw new Error('Gagal mengunduh JSON')
      return res.blob()
    },
    importJson: (data: unknown) =>
      req<{ ok: boolean; imported: Record<string, number> }>('/export/json', { method: 'POST', body: JSON.stringify(data) }),
  },
}

export interface ParseResult {
  amount: number | null
  description: string
  payment_method_id: string | null
  payment_method_name: string | null
  category_id: string | null
  category_name: string | null
  category_type: 'expense' | 'income' | null
  confidence: 'high' | 'low'
  raw_input: string
  occurred_at: string | null
}

export type { BudgetRecord, AccountTransferRecord, RecurringTransactionRecord }