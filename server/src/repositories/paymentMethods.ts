import { pool } from '../config/db'
import type { PaymentMethodRecord } from 'shared'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export async function findAll(): Promise<PaymentMethodRecord[]> {
  const { rows } = await pool.query<PaymentMethodRecord>(
    'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY type, name',
    [OWNER_ID],
  )
  return rows
}

export async function findById(id: string): Promise<PaymentMethodRecord | null> {
  const { rows } = await pool.query<PaymentMethodRecord>(
    'SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2',
    [id, OWNER_ID],
  )
  return rows[0] ?? null
}

export async function create(data: {
  name: string
  type: 'cash' | 'bank' | 'ewallet'
  aliases?: string[] | null
}): Promise<PaymentMethodRecord> {
  const { rows } = await pool.query<PaymentMethodRecord>(
    `INSERT INTO payment_methods (user_id, name, type, aliases)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [OWNER_ID, data.name, data.type, data.aliases ?? null],
  )
  return rows[0]!
}

export async function update(
  id: string,
  data: {
    name?: string
    type?: 'cash' | 'bank' | 'ewallet'
    aliases?: string[] | null
  },
): Promise<PaymentMethodRecord | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name) }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type) }
  if (data.aliases !== undefined) { fields.push(`aliases = $${idx++}`); values.push(data.aliases) }

  if (fields.length === 0) return findById(id)

  values.push(id, OWNER_ID)
  const { rows } = await pool.query<PaymentMethodRecord>(
    `UPDATE payment_methods SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
    [id, OWNER_ID],
  )
  return (rowCount ?? 0) > 0
}