import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.createType('transaction_type', ['expense', 'income'])
  pgm.createType('payment_method_type', ['cash', 'bank', 'ewallet'])
  pgm.createType('transaction_source', ['web', 'telegram_bot', 'recurring'])

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })

  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    name: { type: 'text', notNull: true },
    type: { type: 'transaction_type', notNull: true },
    icon: { type: 'text' },
    keywords: { type: 'text[]' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('categories', 'categories_user_name_type_unique', {
    unique: ['user_id', 'name', 'type'],
  })
  pgm.createIndex('categories', ['user_id', 'type'])

  pgm.createTable('payment_methods', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    name: { type: 'text', notNull: true },
    type: { type: 'payment_method_type', notNull: true },
    aliases: { type: 'text[]' },
    current_balance: { type: 'numeric(14,2)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('payment_methods', 'payment_methods_user_name_unique', {
    unique: ['user_id', 'name'],
  })
  pgm.createIndex('payment_methods', ['user_id'])

  pgm.createTable('transactions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    category_id: { type: 'uuid', notNull: true, references: 'categories' },
    payment_method_id: { type: 'uuid', notNull: true, references: 'payment_methods' },
    type: { type: 'transaction_type', notNull: true },
    amount: { type: 'numeric(14,2)', notNull: true },
    description: { type: 'text' },
    raw_input: { type: 'text' },
    occurred_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    source: { type: 'transaction_source', notNull: true, default: 'web' },
    needs_review: { type: 'boolean', notNull: true, default: false },
    is_deleted: { type: 'boolean', notNull: true, default: false },
    deleted_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('transactions', 'transactions_amount_check', {
    check: 'amount > 0',
  })
  pgm.createIndex('transactions', ['user_id', 'occurred_at'])
  pgm.createIndex('transactions', ['user_id', 'is_deleted'])
  pgm.createIndex('transactions', ['user_id', 'category_id'])
  pgm.createIndex('transactions', ['user_id', 'payment_method_id'])

  pgm.createTable('budgets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    category_id: { type: 'uuid', notNull: true, references: 'categories' },
    month: { type: 'int', notNull: true },
    year: { type: 'int', notNull: true },
    limit_amount: { type: 'numeric(14,2)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('budgets', 'budgets_unique_per_category_month', {
    unique: ['user_id', 'category_id', 'month', 'year'],
  })
  pgm.addConstraint('budgets', 'budgets_month_check', {
    check: 'month BETWEEN 1 AND 12',
  })
  pgm.createIndex('budgets', ['user_id', 'year', 'month'])

  pgm.createTable('account_transfers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    from_payment_method_id: { type: 'uuid', notNull: true, references: 'payment_methods' },
    to_payment_method_id: { type: 'uuid', notNull: true, references: 'payment_methods' },
    amount: { type: 'numeric(14,2)', notNull: true },
    description: { type: 'text' },
    occurred_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    is_deleted: { type: 'boolean', notNull: true, default: false },
    deleted_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('account_transfers', 'account_transfers_amount_check', {
    check: 'amount > 0',
  })
  pgm.addConstraint('account_transfers', 'account_transfers_diff_accounts_check', {
    check: 'from_payment_method_id <> to_payment_method_id',
  })
  pgm.createIndex('account_transfers', ['user_id', 'occurred_at'])

  pgm.createTable('recurring_transactions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    category_id: { type: 'uuid', notNull: true, references: 'categories' },
    payment_method_id: { type: 'uuid', notNull: true, references: 'payment_methods' },
    type: { type: 'transaction_type', notNull: true },
    amount: { type: 'numeric(14,2)', notNull: true },
    description: { type: 'text', notNull: true },
    day_of_month: { type: 'int', notNull: true },
    is_active: { type: 'boolean', notNull: true, default: true },
    last_generated_at: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.addConstraint('recurring_transactions', 'recurring_transactions_day_check', {
    check: 'day_of_month BETWEEN 1 AND 28',
  })
  pgm.createIndex('recurring_transactions', ['user_id', 'is_active'])

  pgm.createTable('quick_actions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    label: { type: 'text', notNull: true },
    category_id: { type: 'uuid', notNull: true, references: 'categories' },
    payment_method_id: { type: 'uuid', notNull: true, references: 'payment_methods' },
    amount: { type: 'numeric(14,2)', notNull: true },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createIndex('quick_actions', ['user_id'])
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropTable('quick_actions')
  pgm.dropTable('recurring_transactions')
  pgm.dropTable('account_transfers')
  pgm.dropTable('budgets')
  pgm.dropTable('transactions')
  pgm.dropTable('payment_methods')
  pgm.dropTable('categories')
  pgm.dropTable('users')
  pgm.dropType('transaction_source')
  pgm.dropType('payment_method_type')
  pgm.dropType('transaction_type')
}

export const shorthands = undefined