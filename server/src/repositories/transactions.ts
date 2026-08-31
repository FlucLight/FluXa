import { pool } from '../config/db'
import type { TransactionRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export interface ListFilter {
  from: string | undefined
  to: string | undefined
  category_id: string | undefined
  payment_method_id: string | undefined
  type: 'expense' | 'income' | undefined
  deleted: boolean
}

const DEFAULT_FILTER: ListFilter = {
  from: undefined, to: undefined, category_id: undefined,
  payment_method_id: undefined, type: undefined, deleted: false,
}

export async function findAll(filter: ListFilter = DEFAULT_FILTER): Promise<TransactionRecord[]> {
  const conditions: string[] = [`user_id = $1`]
  const values: unknown[] = [OWNER_ID]
  let idx = 2

  conditions.push(`is_deleted = $${idx++}`)
  values.push(filter.deleted ?? false)

  if (filter.from) { conditions.push(`occurred_at >= $${idx++}`); values.push(filter.from) }
  if (filter.to) { conditions.push(`occurred_at <= $${idx++}`); values.push(filter.to) }
  if (filter.category_id) { conditions.push(`category_id = $${idx++}`); values.push(filter.category_id) }
  if (filter.payment_method_id) { conditions.push(`payment_method_id = $${idx++}`); values.push(filter.payment_method_id) }
  if (filter.type) { conditions.push(`type = $${idx++}`); values.push(filter.type) }

  const { rows } = await pool.query<TransactionRecord>(
    `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY occurred_at DESC`,
    values,
  )
  return rows
}

export async function findById(id: string): Promise<TransactionRecord | null> {
  const { rows } = await pool.query<TransactionRecord>(
    'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
    [id, OWNER_ID],
  )
  return rows[0] ?? null
}

export async function create(data: {
  type: 'expense' | 'income'
  amount: number
  category_id: string
  payment_method_id: string
  description?: string | null
  raw_input?: string | null
  occurred_at?: string | null
  source?: 'web' | 'telegram_bot' | 'recurring'
  needs_review?: boolean
}): Promise<TransactionRecord> {
  const { rows } = await pool.query<TransactionRecord>(
    `INSERT INTO transactions
       (user_id, type, amount, category_id, payment_method_id, description, raw_input, occurred_at, source, needs_review)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, now()), $9, $10)
     RETURNING *`,
    [
      OWNER_ID,
      data.type,
      data.amount,
      data.category_id,
      data.payment_method_id,
      data.description ?? null,
      data.raw_input ?? null,
      data.occurred_at ?? null,
      data.source ?? 'web',
      data.needs_review ?? false,
    ],
  )
  return rows[0]!
}

export async function update(
  id: string,
  data: {
    type?: 'expense' | 'income'
    amount?: number
    category_id?: string
    payment_method_id?: string
    description?: string | null
    occurred_at?: string | null
    needs_review?: boolean
  },
): Promise<TransactionRecord | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type) }
  if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount) }
  if (data.category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(data.category_id) }
  if (data.payment_method_id !== undefined) { fields.push(`payment_method_id = $${idx++}`); values.push(data.payment_method_id) }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description) }
  if (data.occurred_at !== undefined) { fields.push(`occurred_at = $${idx++}`); values.push(data.occurred_at) }
  if (data.needs_review !== undefined) { fields.push(`needs_review = $${idx++}`); values.push(data.needs_review) }

  if (fields.length === 0) return findById(id)

  values.push(id, OWNER_ID)
  const { rows } = await pool.query<TransactionRecord>(
    `UPDATE transactions SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx} AND is_deleted = false
     RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function softDelete(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE transactions SET is_deleted = true, deleted_at = now()
     WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}

export async function restore(id: string): Promise<TransactionRecord | null> {
  const { rows } = await pool.query<TransactionRecord>(
    `UPDATE transactions SET is_deleted = false, deleted_at = null
     WHERE id = $1 AND user_id = $2 AND is_deleted = true
     RETURNING *`,
    [id, OWNER_ID],
  )
  return rows[0] ?? null
}