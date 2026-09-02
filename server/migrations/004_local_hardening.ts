import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns('transactions', {
    telegram_chat_id: { type: 'bigint' },
  })
  pgm.createIndex('transactions', ['user_id', 'source', 'telegram_chat_id'])

  pgm.addColumns('payment_methods', {
    initial_balance: { type: 'numeric(14,2)', notNull: true, default: 0 },
  })
  pgm.sql(`
    UPDATE payment_methods
    SET initial_balance = COALESCE(current_balance, 0)
    WHERE current_balance IS NOT NULL
  `)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropIndex('transactions', ['user_id', 'source', 'telegram_chat_id'])
  pgm.dropColumns('transactions', ['telegram_chat_id'])
  pgm.dropColumns('payment_methods', ['initial_balance'])
}

export const shorthands = undefined
