import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.createTable('passkeys', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    credential_id: { type: 'text', notNull: true, unique: true },
    public_key: { type: 'text', notNull: true },
    counter: { type: 'bigint', notNull: true, default: 0 },
    transports: { type: 'text[]' },
    device_name: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_used_at: { type: 'timestamptz' },
  })
  pgm.createIndex('passkeys', ['user_id'])
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('passkeys')
}

export const shorthands = undefined