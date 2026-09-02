import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.createIndex('recurring_transactions', ['user_id', 'is_active', 'next_due_at'])
  pgm.createIndex('account_transfers', ['user_id', 'is_deleted'])
  pgm.createIndex('account_transfers', ['from_payment_method_id'])
  pgm.createIndex('account_transfers', ['to_payment_method_id'])
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropIndex('recurring_transactions', ['user_id', 'is_active', 'next_due_at'])
  pgm.dropIndex('account_transfers', ['user_id', 'is_deleted'])
  pgm.dropIndex('account_transfers', ['from_payment_method_id'])
  pgm.dropIndex('account_transfers', ['to_payment_method_id'])
}

export const shorthands = undefined
