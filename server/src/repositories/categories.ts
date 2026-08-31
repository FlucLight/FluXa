import { pool } from '../config/db'
import type { CategoryRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export async function findAll(type?: 'expense' | 'income'): Promise<CategoryRecord[]> {
  if (type) {
    const { rows } = await pool.query<CategoryRecord>(
      'SELECT * FROM categories WHERE user_id = $1 AND type = $2 ORDER BY name',
      [OWNER_ID, type],
    )
    return rows
  }
  const { rows } = await pool.query<CategoryRecord>(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name',
    [OWNER_ID],
  )
  return rows
}

export async function findById(id: string): Promise<CategoryRecord | null> {
  const { rows } = await pool.query<CategoryRecord>(
    'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
    [id, OWNER_ID],
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
    [OWNER_ID, data.name, data.type, data.icon ?? null, data.keywords ?? null],
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

  values.push(id, OWNER_ID)
  const { rows } = await pool.query<CategoryRecord>(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2',
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}