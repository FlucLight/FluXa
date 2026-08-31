import { pool } from '../config/db'
import type { BudgetRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export async function findAll(month?: number, year?: number): Promise<BudgetRecord[]> {
  const conditions = [`user_id = $1`]
  const values: unknown[] = [OWNER_ID]
  let idx = 2
  if (month) { conditions.push(`month = $${idx++}`); values.push(month) }
  if (year) { conditions.push(`year = $${idx++}`); values.push(year) }
  const { rows } = await pool.query<BudgetRecord>(
    `SELECT * FROM budgets WHERE ${conditions.join(' AND ')} ORDER BY year DESC, month DESC`,
    values,
  )
  return rows
}

export async function create(data: {
  category_id: string
  month: number
  year: number
  limit_amount: number
}): Promise<BudgetRecord> {
  const { rows } = await pool.query<BudgetRecord>(
    `INSERT INTO budgets (user_id, category_id, month, year, limit_amount)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, category_id, month, year)
     DO UPDATE SET limit_amount = EXCLUDED.limit_amount
     RETURNING *`,
    [OWNER_ID, data.category_id, data.month, data.year, data.limit_amount],
  )
  return rows[0]!
}

export async function update(id: string, limit_amount: number): Promise<BudgetRecord | null> {
  const { rows } = await pool.query<BudgetRecord>(
    `UPDATE budgets SET limit_amount = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [limit_amount, id, OWNER_ID],
  )
  return rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM budgets WHERE id = $1 AND user_id = $2`,
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}