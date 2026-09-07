import { pool } from '../config/db'

export interface SessionRow {
  id: string
  user_id: string
  token_hash: string
  user_agent: string | null
  expires_at: Date
  created_at: Date
  last_used_at: Date | null
  revoked_at: Date | null
}

export async function createSession(input: {
  userId: string
  tokenHash: string
  userAgent: string | null
  expiresAt: Date
}): Promise<SessionRow> {
  const { rows } = await pool.query<SessionRow>(
    `INSERT INTO sessions (user_id, token_hash, user_agent, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.userId, input.tokenHash, input.userAgent, input.expiresAt],
  )
  const row = rows[0]
  if (!row) throw new Error('Failed to create session')
  return row
}

export async function findSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
  const { rows } = await pool.query<SessionRow>(`SELECT * FROM sessions WHERE token_hash = $1`, [tokenHash])
  return rows[0] ?? null
}

export async function touchSession(id: string): Promise<void> {
  await pool.query(`UPDATE sessions SET last_used_at = now() WHERE id = $1`, [id])
}

export async function revokeSession(id: string): Promise<void> {
  await pool.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [id])
}

export async function revokeAllSessions(userId: string, exceptId?: string): Promise<void> {
  if (exceptId) {
    await pool.query(
      `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND id <> $2`,
      [userId, exceptId],
    )
  } else {
    await pool.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId])
  }
}

export async function purgeExpiredSessions(): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE expires_at < now() OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days')`)
}