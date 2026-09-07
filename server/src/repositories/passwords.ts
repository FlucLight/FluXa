import { pool } from '../config/db'

export interface PasswordResetRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
  created_at: Date
  used_at: Date | null
}

export async function createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
  await pool.query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
    input.userId,
    input.tokenHash,
    input.expiresAt,
  ])
}

export async function findValidToken(tokenHash: string, now = new Date()): Promise<PasswordResetRow | null> {
  const { rows } = await pool.query<PasswordResetRow>(
    `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2`,
    [tokenHash, now],
  )
  return rows[0] ?? null
}

export async function consumeToken(id: string): Promise<void> {
  await pool.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [id])
}

export async function purgeExpiredTokens(): Promise<void> {
  await pool.query(`DELETE FROM password_reset_tokens WHERE expires_at < now() OR used_at IS NOT NULL`)
}