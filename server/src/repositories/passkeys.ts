import { pool } from '../config/db'

export interface PasskeyRow {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  counter: string
  transports: string[] | null
  device_name: string | null
  created_at: Date
  last_used_at: Date | null
}

export interface PasskeyPublic {
  id: string
  device_name: string | null
  created_at: Date
  last_used_at: Date | null
}

export function toPublic(row: PasskeyRow): PasskeyPublic {
  return {
    id: row.id,
    device_name: row.device_name,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  }
}

export async function createPasskey(input: {
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  transports: string[] | null
  deviceName: string | null
}): Promise<PasskeyRow> {
  const { rows } = await pool.query<PasskeyRow>(
    `INSERT INTO passkeys (user_id, credential_id, public_key, counter, transports, device_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.userId, input.credentialId, input.publicKey, input.counter, input.transports, input.deviceName],
  )
  const row = rows[0]
  if (!row) throw new Error('Failed to create passkey')
  return row
}

export async function findPasskeyByCredentialId(credentialId: string): Promise<PasskeyRow | null> {
  const { rows } = await pool.query<PasskeyRow>(`SELECT * FROM passkeys WHERE credential_id = $1`, [credentialId])
  return rows[0] ?? null
}

export async function listPasskeysByUser(userId: string): Promise<PasskeyPublic[]> {
  const { rows } = await pool.query<PasskeyRow>(
    `SELECT * FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  )
  return rows.map(toPublic)
}

export async function deletePasskey(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM passkeys WHERE id = $1 AND user_id = $2`, [id, userId])
  return (result.rowCount ?? 0) > 0
}

export async function updatePasskeyCounter(id: string, counter: number): Promise<void> {
  await pool.query(`UPDATE passkeys SET counter = $2, last_used_at = now() WHERE id = $1`, [id, counter])
}