import { pool } from '../config/db'
import type { AccountTransferRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export type TransferSortOrder = 'newest' | 'oldest' | 'most' | 'least'

function resolveOrderClause(sort: TransferSortOrder | undefined): string {
  switch (sort) {
    case 'oldest': return 'occurred_at ASC, created_at ASC'
    case 'most': return 'amount DESC, occurred_at DESC'
    case 'least': return 'amount ASC, occurred_at DESC'
    case 'newest':
    default: return 'occurred_at DESC, created_at DESC'
  }
}

export interface TransferFilter {
  from: string | undefined
  to: string | undefined
  sort: TransferSortOrder | undefined
  limit?: number | undefined
  offset?: number | undefined
}

export async function findAll(
  filter: TransferFilter = { from: undefined, to: undefined, sort: undefined },
): Promise<AccountTransferRecord[]> {
  const conditions = [`user_id = $1`, `is_deleted = false`]
  const values: unknown[] = [OWNER_ID]
  let idx = 2
  if (filter.from) { conditions.push(`occurred_at >= $${idx++}`); values.push(filter.from) }
  if (filter.to) { conditions.push(`occurred_at <= $${idx++}`); values.push(filter.to) }
  const order = resolveOrderClause(filter.sort)
  let sql = `SELECT * FROM account_transfers WHERE ${conditions.join(' AND ')} ORDER BY ${order}`
  if (filter.limit !== undefined) {
    sql += ` LIMIT $${idx++}`
    values.push(filter.limit)
  }
  if (filter.offset !== undefined) {
    sql += ` OFFSET $${idx++}`
    values.push(filter.offset)
  }
  const { rows } = await pool.query<AccountTransferRecord>(sql, values)
  return rows
}

export async function countAll(filter: Omit<TransferFilter, 'limit' | 'offset'>): Promise<number> {
  const conditions = [`user_id = $1`, `is_deleted = false`]
  const values: unknown[] = [OWNER_ID]
  let idx = 2
  if (filter.from) { conditions.push(`occurred_at >= $${idx++}`); values.push(filter.from) }
  if (filter.to) { conditions.push(`occurred_at <= $${idx++}`); values.push(filter.to) }
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM account_transfers WHERE ${conditions.join(' AND ')}`,
    values,
  )
  return Number(rows[0]?.count ?? 0)
}

export async function create(data: {
  from_payment_method_id: string
  to_payment_method_id: string
  amount: number
  description?: string | null
  occurred_at?: string | null
}): Promise<AccountTransferRecord> {
  const { rows } = await pool.query<AccountTransferRecord>(
    `INSERT INTO account_transfers (user_id, from_payment_method_id, to_payment_method_id, amount, description, occurred_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, now()))
     RETURNING *`,
    [OWNER_ID, data.from_payment_method_id, data.to_payment_method_id, data.amount, data.description ?? null, data.occurred_at ?? null],
  )
  return rows[0]!
}

export async function softDelete(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE account_transfers SET is_deleted = true, deleted_at = now()
     WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}