import { pool } from '../config/db'
import { userId } from '../services/identity'
import type { CategoryRecord } from 'shared'

export async function findAll(type?: 'expense' | 'income'): Promise<CategoryRecord[]> {
  if (type) {
    const { rows } = await pool.query<CategoryRecord>(
      'SELECT * FROM categories WHERE user_id = $1 AND type = $2 ORDER BY name',
      [userId(), type],
    )
    return rows
  }
  const { rows } = await pool.query<CategoryRecord>(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
    [userId()],
  )
  return rows
}

export async function findById(id: string): Promise<CategoryRecord | null> {
  const { rows } = await pool.query<CategoryRecord>(
    'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
    [id, userId()],
  )
  return rows[0] ?? null
}

export async function create(data: {
  name: string
  type: 'expense' | 'income'
  icon?: string | null
  keywords?: string[] | null
}): Promise<CategoryRecord> {
  const { rows } = await pool.query<CategoryRecord>(
    `INSERT INTO categories (user_id, name, type, icon, keywords)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId(), data.name, data.type, data.icon ?? null, data.keywords ?? null],
  )
  return rows[0]!
}

export async function update(
  id: string,
  data: {
    name?: string
    type?: 'expense' | 'income'
    icon?: string | null
    keywords?: string[] | null
  },
): Promise<CategoryRecord | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name) }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type) }
  if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(data.icon) }
  if (data.keywords !== undefined) { fields.push(`keywords = $${idx++}`); values.push(data.keywords) }

  if (fields.length === 0) return findById(id)

  values.push(id, userId())
  const { rows } = await pool.query<CategoryRecord>(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function countUsage(id: string): Promise<{ transactions: number; budgets: number; recurring: number }> {
  const [txRes, budgetRes, recRes] = await Promise.all([
    pool.query<{ count: string }>('SELECT count(*) FROM transactions WHERE category_id = $1 AND user_id = $2', [id, userId()]),
    pool.query<{ count: string }>('SELECT count(*) FROM budgets WHERE category_id = $1 AND user_id = $2', [id, userId()]),
    pool.query<{ count: string }>('SELECT count(*) FROM recurring_transactions WHERE category_id = $1 AND user_id = $2', [id, userId()]),
  ])
  return {
    transactions: parseInt(txRes.rows[0]?.count ?? '0', 10),
    budgets: parseInt(budgetRes.rows[0]?.count ?? '0', 10),
    recurring: parseInt(recRes.rows[0]?.count ?? '0', 10),
  }
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2',
    [id, userId()],
  )
  return (rowCount ?? 0) > 0
}