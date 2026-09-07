import { pool } from '../config/db'
import { LEGACY_USER_ID } from '../services/identity'
import type { AuthUser } from '../services/identity'

const USER_COLS = 'id, name, email, avatar_url, created_at'

export interface StoredUser extends AuthUser {
  password_hash: string | null
  avatar_url: string | null
  created_at: Date
}

function toAuthUser(row: { id: string; name: string; email: string | null }): AuthUser {
  return { id: row.id, name: row.name, email: row.email }
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<{ id: string; name: string; email: string | null }>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [id],
  )
  return rows[0] ? toAuthUser(rows[0]) : null
}

export async function findUserWithHashByEmail(email: string): Promise<StoredUser | null> {
  const { rows } = await pool.query<StoredUser>(
    `SELECT ${USER_COLS}, password_hash FROM users WHERE lower(email) = lower($1)`,
    [email],
  )
  return rows[0] ?? null
}

export async function findUserWithHashById(id: string): Promise<StoredUser | null> {
  const { rows } = await pool.query<StoredUser>(
    `SELECT ${USER_COLS}, password_hash FROM users WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<{ id: string; name: string; email: string | null }>(
    `SELECT id, name, email FROM users WHERE lower(email) = lower($1)`,
    [email],
  )
  return rows[0] ? toAuthUser(rows[0]) : null
}

export async function findUserByGoogleSub(sub: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<{ id: string; name: string; email: string | null }>(
    `SELECT id, name, email FROM users WHERE google_sub = $1`,
    [sub],
  )
  return rows[0] ? toAuthUser(rows[0]) : null
}

export async function attachGoogleSub(id: string, sub: string): Promise<void> {
  await pool.query(`UPDATE users SET google_sub = $2, updated_at = now() WHERE id = $1 AND google_sub IS NULL`, [
    id,
    sub,
  ])
}

export async function claimOrCreateGoogleUser(input: {
  email: string
  name: string
  googleSub: string
}): Promise<{ user: AuthUser }> {
  const existingBySub = await findUserByGoogleSub(input.googleSub)
  if (existingBySub) return { user: existingBySub }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [727002])

    const existingByEmail = await client.query<{ id: string; name: string; email: string | null }>(
      `SELECT id, name, email FROM users WHERE lower(email) = lower($1)`,
      [input.email],
    )
    if (existingByEmail.rows[0]) {
      const row = existingByEmail.rows[0]
      const attached = await client.query(
        `UPDATE users SET google_sub = $2, updated_at = now() WHERE id = $1 AND google_sub IS NULL`,
        [row.id, input.googleSub],
      )
      if (attached.rowCount === 0) {
        await client.query(`UPDATE users SET google_sub = $3, name = $2, updated_at = now() WHERE id = $1`, [
          row.id,
          input.name,
          input.googleSub,
        ])
      }
      await client.query('COMMIT')
      return { user: toAuthUser(row) }
    }

    const legacy = await client.query<{ id: string; email: string | null; password_hash: string | null }>(
      `SELECT id, email, password_hash FROM users WHERE id = $1`,
      [LEGACY_USER_ID],
    )
    if (legacy.rows[0] && legacy.rows[0].email === null && legacy.rows[0].password_hash === null) {
      const updated = await client.query<{ id: string; name: string; email: string | null }>(
        `UPDATE users
         SET name = $1, email = lower($2), google_sub = $3, avatar_url = NULL, updated_at = now()
         WHERE id = $4 AND email IS NULL AND password_hash IS NULL
         RETURNING id, name, email`,
        [input.name, input.email, input.googleSub, LEGACY_USER_ID],
      )
      if (!updated.rows[0]) throw new Error('Failed to claim legacy account')
      await client.query('COMMIT')
      return { user: toAuthUser(updated.rows[0]) }
    }

    const created = await client.query<{ id: string; name: string; email: string | null }>(
      `INSERT INTO users (name, email, google_sub)
       VALUES ($1, lower($2), $3)
       RETURNING id, name, email`,
      [input.name, input.email, input.googleSub],
    )
    if (!created.rows[0]) throw new Error('Failed to create account')
    await client.query('COMMIT')
    return { user: toAuthUser(created.rows[0]) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export interface RegisterUserResult {
  user: AuthUser
  claimedLegacy: boolean
}

export async function registerUser(input: {
  name: string
  email: string
  passwordHash: string
}): Promise<RegisterUserResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query('SELECT pg_advisory_xact_lock($1)', [727001])

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [input.email],
    )
    if (existing.rows[0]) {
      await client.query('ROLLBACK')
      return { user: toAuthUser({ id: existing.rows[0].id, name: '', email: input.email }), claimedLegacy: false }
    }

    const legacy = await client.query<{ id: string; name: string; email: string | null; password_hash: string | null }>(
      `SELECT id, name, email, password_hash FROM users WHERE id = $1`,
      [LEGACY_USER_ID],
    )

    if (legacy.rows[0] && legacy.rows[0].email === null && legacy.rows[0].password_hash === null) {
      const updated = await client.query<{ id: string; name: string; email: string | null }>(
        `UPDATE users
         SET name = $1, email = lower($2), password_hash = $3, avatar_url = NULL, updated_at = now()
         WHERE id = $4 AND email IS NULL AND password_hash IS NULL
         RETURNING id, name, email`,
        [input.name, input.email, input.passwordHash, LEGACY_USER_ID],
      )
      if (!updated.rows[0]) throw new Error('Failed to claim legacy account')
      await client.query('COMMIT')
      return { user: toAuthUser(updated.rows[0]), claimedLegacy: true }
    }

    const created = await client.query<{ id: string; name: string; email: string | null }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, lower($2), $3)
       RETURNING id, name, email`,
      [input.name, input.email, input.passwordHash],
    )
    if (!created.rows[0]) throw new Error('Failed to create account')
    await client.query('COMMIT')
    return { user: toAuthUser(created.rows[0]), claimedLegacy: false }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updatePasswordHash(id: string, passwordHash: string): Promise<void> {
  await pool.query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [id, passwordHash])
}