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

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
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
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req<TransactionRecord[]>(`/transactions${qs}`)
    },
    create: (data: CreateTransactionInput) =>
      req<TransactionRecord>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTransactionInput) =>
      req<TransactionRecord>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/transactions/${id}`, { method: 'DELETE' }),
    restore: (id: string) =>
      req<TransactionRecord>(`/transactions/${id}/restore`, { method: 'POST' }),
    deleted: () => req<TransactionRecord[]>('/transactions?deleted=true'),
    parse: (text: string) =>
      req<ParseResult>('/transactions/parse', { method: 'POST', body: JSON.stringify({ text }) }),
    quick: (text: string, occurredAt?: string | null) =>
      req<{ transaction: TransactionRecord; parsed: ParseResult }>('/transactions/quick', {
        method: 'POST',
        body: JSON.stringify({ text, ...(occurredAt ? { occurred_at: occurredAt } : {}) }),
      }),
  },

  transfers: {
    list: () => req<AccountTransferRecord[]>('/transfers'),
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
    create: (data: { category_id: string; payment_method_id: string; type: 'expense' | 'income'; amount: number; description: string; day_of_month: number }) =>
      req<RecurringTransactionRecord>('/recurring-transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ is_active: boolean; amount: number; description: string; day_of_month: number }>) =>
      req<RecurringTransactionRecord>(`/recurring-transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => req<void>(`/recurring-transactions/${id}`, { method: 'DELETE' }),
  },

  export: {
    csv: () => fetch('/api/export/csv').then(r => r.blob()),
    json: () => fetch('/api/export/json').then(r => r.blob()),
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