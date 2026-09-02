import { pool } from '../config/db'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export interface SummaryTotals {
  income: number
  expense: number
  net: number
  transactionCount: number
}

export interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
}

export async function totals(from?: string, to?: string): Promise<SummaryTotals> {
  const conditions = ['user_id = $1', 'is_deleted = false']
  const values: unknown[] = [OWNER_ID]
  let index = 2
  if (from) {
    conditions.push(`occurred_at >= $${index++}`)
    values.push(from)
  }
  if (to) {
    conditions.push(`occurred_at <= $${index++}`)
    values.push(to)
  }

  const { rows } = await pool.query<{ type: 'income' | 'expense'; total: string; count: string }>(
    `SELECT type, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
     FROM transactions
     WHERE ${conditions.join(' AND ')}
     GROUP BY type`,
    values,
  )
  const income = Number(rows.find((row) => row.type === 'income')?.total ?? 0)
  const expense = Number(rows.find((row) => row.type === 'expense')?.total ?? 0)
  const transactionCount = rows.reduce((sum, row) => sum + Number(row.count), 0)
  return { income, expense, net: income - expense, transactionCount }
}

export async function accountBalances(): Promise<AccountBalance[]> {
  const { rows } = await pool.query<AccountBalance>(
    `SELECT
       pm.id,
       pm.name,
       pm.type,
       COALESCE(pm.initial_balance, 0)
         + COALESCE(income.total, 0) - COALESCE(expense.total, 0)
         + COALESCE(received.total, 0) - COALESCE(sent.total, 0) AS balance
     FROM payment_methods pm
     LEFT JOIN (
       SELECT payment_method_id, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND is_deleted = false AND type = 'income'
       GROUP BY payment_method_id
     ) income ON income.payment_method_id = pm.id
     LEFT JOIN (
       SELECT payment_method_id, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND is_deleted = false AND type = 'expense'
       GROUP BY payment_method_id
     ) expense ON expense.payment_method_id = pm.id
     LEFT JOIN (
       SELECT to_payment_method_id AS payment_method_id, SUM(amount) AS total
       FROM account_transfers
       WHERE user_id = $1 AND is_deleted = false
       GROUP BY to_payment_method_id
     ) received ON received.payment_method_id = pm.id
     LEFT JOIN (
       SELECT from_payment_method_id AS payment_method_id, SUM(amount) AS total
       FROM account_transfers
       WHERE user_id = $1 AND is_deleted = false
       GROUP BY from_payment_method_id
     ) sent ON sent.payment_method_id = pm.id
     WHERE pm.user_id = $1
     ORDER BY pm.type, pm.name`,
    [OWNER_ID],
  )
  return rows.map((row) => ({ ...row, balance: Number(row.balance) }))
}
