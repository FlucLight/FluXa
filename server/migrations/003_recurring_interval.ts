import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns('recurring_transactions', {
    interval: { type: 'text', notNull: true, default: 'month' },
    interval_steps: { type: 'int', notNull: true, default: 1 },
    target_count: { type: 'int' },
    times_generated: { type: 'int', notNull: true, default: 0 },
    next_due_at: { type: 'date' },
  })

  pgm.addConstraint('recurring_transactions', 'recurring_transactions_interval_check', {
    check: "interval IN ('day', 'week', 'month')",
  })
  pgm.addConstraint('recurring_transactions', 'recurring_transactions_interval_steps_check', {
    check: 'interval_steps >= 1',
  })
  pgm.addConstraint('recurring_transactions', 'recurring_transactions_target_check', {
    check: 'target_count IS NULL OR target_count > 0',
  })

  pgm.sql(`
    UPDATE recurring_transactions
    SET next_due_at = CASE
      WHEN date_trunc('month', CURRENT_DATE) + (day_of_month - 1) * interval '1 day' >= CURRENT_DATE
        THEN (date_trunc('month', CURRENT_DATE) + (day_of_month - 1) * interval '1 day')::date
      ELSE (date_trunc('month', CURRENT_DATE) + interval '1 month' + (day_of_month - 1) * interval '1 day')::date
    END
    WHERE next_due_at IS NULL
  `)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropConstraint('recurring_transactions', 'recurring_transactions_target_check')
  pgm.dropConstraint('recurring_transactions', 'recurring_transactions_interval_steps_check')
  pgm.dropConstraint('recurring_transactions', 'recurring_transactions_interval_check')
  pgm.dropColumns('recurring_transactions', [
    'next_due_at',
    'times_generated',
    'target_count',
    'interval_steps',
    'interval',
  ])
}

export const shorthands = undefined
