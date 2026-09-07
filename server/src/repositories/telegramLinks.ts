import { pool } from '../config/db'

export interface TelegramLinkRow {
  id: string
  user_id: string
  code_hash: string | null
  chat_id: string | null
  expires_at: Date
  created_at: Date
  linked_at: Date | null
}

export interface TelegramLinkStatus {
  status: 'pending' | 'linked'
  chat_id: string | null
  expires_at: Date | null
}

export async function createPendingLink(input: { userId: string; codeHash: string; expiresAt: Date }): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM telegram_links WHERE user_id = $1`, [input.userId])
    await client.query(
      `INSERT INTO telegram_links (user_id, code_hash, expires_at) VALUES ($1, $2, $3)`,
      [input.userId, input.codeHash, input.expiresAt],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getLinkStatus(userId: string): Promise<TelegramLinkStatus | null> {
  const { rows } = await pool.query<TelegramLinkRow>(
    `SELECT * FROM telegram_links WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  )
  const row = rows[0]
  if (!row) return null
  if (row.linked_at && row.chat_id !== null) {
    return { status: 'linked', chat_id: row.chat_id, expires_at: null }
  }
  return { status: 'pending', chat_id: null, expires_at: row.expires_at }
}

export async function confirmLinkWithCode(
  codeHash: string,
  chatId: number,
  now = new Date(),
): Promise<{ userId: string } | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [727003])

    const pending = await client.query<TelegramLinkRow>(
      `SELECT * FROM telegram_links
       WHERE code_hash = $1 AND linked_at IS NULL AND expires_at > $2
       FOR UPDATE`,
      [codeHash, now],
    )
    if (!pending.rows[0]) {
      await client.query('COMMIT')
      return null
    }

    // Chat mengikuti pengguna terbaru yang tertaut.
    await client.query(`DELETE FROM telegram_links WHERE chat_id = $1 AND linked_at IS NOT NULL`, [String(chatId)])

    const row = pending.rows[0]
    await client.query(
      `UPDATE telegram_links SET chat_id = $2, linked_at = now() WHERE id = $1`,
      [row.id, String(chatId)],
    )
    await client.query('COMMIT')
    return { userId: row.user_id }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findUserIdByChatId(chatId: number): Promise<string | null> {
  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM telegram_links WHERE chat_id = $1 AND linked_at IS NOT NULL`,
    [String(chatId)],
  )
  return rows[0]?.user_id ?? null
}

export async function revokeLink(userId: string): Promise<void> {
  await pool.query(`DELETE FROM telegram_links WHERE user_id = $1`, [userId])
}

export async function purgeExpiredPendingLinks(): Promise<void> {
  await pool.query(`DELETE FROM telegram_links WHERE linked_at IS NULL AND expires_at < now()`)
}