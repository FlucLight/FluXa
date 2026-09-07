import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns('users', {
    email: { type: 'text' },
    password_hash: { type: 'text' },
    avatar_url: { type: 'text' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.sql(`CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email)) WHERE email IS NOT NULL`)

  pgm.createTable('sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    token_hash: { type: 'text', notNull: true, unique: true },
    user_agent: { type: 'text' },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_used_at: { type: 'timestamptz' },
    revoked_at: { type: 'timestamptz' },
  })
  pgm.createIndex('sessions', ['user_id'])
  pgm.createIndex('sessions', ['expires_at'])

  pgm.createTable('password_reset_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    token_hash: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    used_at: { type: 'timestamptz' },
  })
  pgm.createIndex('password_reset_tokens', ['user_id'])
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('password_reset_tokens')
  pgm.dropTable('sessions')
  pgm.sql('DROP INDEX IF EXISTS users_email_lower_unique')
  pgm.dropColumns('users', ['email', 'password_hash', 'avatar_url', 'updated_at'])
}

export const shorthands = undefined