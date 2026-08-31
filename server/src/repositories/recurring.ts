import { pool } from '../config/db'
import type { RecurringTransactionRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export async function findAll(): Promise<RecurringTransactionRecord[]> {
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY day_of_month`,
    [OWNER_ID],
  )
  return rows
}

export async function create(data: {
  category_id: string
  payment_method_id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  day_of_month: number
}): Promise<RecurringTransactionRecord> {
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `INSERT INTO recurring_transactions (user_id, category_id, payment_method_id, type, amount, description, day_of_month)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [OWNER_ID, data.category_id, data.payment_method_id, data.type, data.amount, data.description, data.day_of_month],
  )
  return rows[0]!
}

export async function update(id: string, data: Partial<{
  category_id: string
  payment_method_id: string
  type: 'expense' | 'income'
  amount: number
  description: string
  day_of_month: number
  is_active: boolean
}>): Promise<RecurringTransactionRecord | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1
  const allowed = ['category_id', 'payment_method_id', 'type', 'amount', 'description', 'day_of_month', 'is_active'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${idx++}`); values.push(data[key]) }
  }
  if (!fields.length) return null
  values.push(id, OWNER_ID)
  const { rows } = await pool.query<RecurringTransactionRecord>(
    `UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2`,
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}

export async function runDue(): Promise<number> {
  const today = new Date()
  const dayOfMonth = today.getDate()
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const { rows } = await pool.query<RecurringTransactionRecord>(
    `SELECT * FROM recurring_transactions
     WHERE user_id = $1 AND is_active = true AND day_of_month = $2
     AND (last_generated_at IS NULL OR last_generated_at < $3::date)`,
    [OWNER_ID, dayOfMonth, monthStr],
  )

  for (const r of rows) {
    await pool.query(
      `INSERT INTO transactions (user_id, category_id, payment_method_id, type, amount, description, source, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'recurring', now())`,
      [OWNER_ID, r.category_id, r.payment_method_id, r.type, r.amount, r.description],
    )
    await pool.query(
      `UPDATE recurring_transactions SET last_generated_at = CURRENT_DATE WHERE id = $1`,
      [r.id],
    )
  }
  return rows.length
}