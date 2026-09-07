import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable('telegram_links', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    code_hash: { type: 'text', notNull: true },
    chat_id: { type: 'bigint' },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    linked_at: { type: 'timestamptz' },
  })
  pgm.createIndex('telegram_links', ['user_id'])
  pgm.createIndex('telegram_links', ['chat_id'])
  pgm.sql(
    `CREATE UNIQUE INDEX telegram_links_code_hash_key ON telegram_links (code_hash) WHERE code_hash IS NOT NULL`,
  )
  pgm.sql(
    `CREATE UNIQUE INDEX telegram_links_chat_id_key ON telegram_links (chat_id) WHERE chat_id IS NOT NULL`,
  )
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('telegram_links')
}

export const shorthands = undefined