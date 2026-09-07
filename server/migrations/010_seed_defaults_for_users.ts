import type { MigrationBuilder } from 'node-pg-migrate'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export const up = (pgm: MigrationBuilder): void => {
  pgm.sql(`
    INSERT INTO categories (user_id, name, type, icon, keywords)
    SELECT u.id, c.name, c.type, c.icon, c.keywords
    FROM users u
    JOIN categories c ON c.user_id = '${OWNER_ID}'
    WHERE u.id <> '${OWNER_ID}'
      AND NOT EXISTS (
        SELECT 1 FROM categories cc
        WHERE cc.user_id = u.id AND cc.name = c.name AND cc.type = c.type
      )
  `)
  pgm.sql(`
    INSERT INTO payment_methods (user_id, name, type, aliases, initial_balance)
    SELECT u.id, pm.name, pm.type, pm.aliases, 0
    FROM users u
    JOIN payment_methods pm ON pm.user_id = '${OWNER_ID}'
    WHERE u.id <> '${OWNER_ID}'
      AND NOT EXISTS (
        SELECT 1 FROM payment_methods pp
        WHERE pp.user_id = u.id AND pp.name = pm.name
      )
  `)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.sql(`
    DELETE FROM categories c
    WHERE c.user_id <> '${OWNER_ID}'
      AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.category_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM budgets b WHERE b.category_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM quick_actions qa WHERE qa.category_id = c.id)
  `)
  pgm.sql(`
    DELETE FROM payment_methods pm
    WHERE pm.user_id <> '${OWNER_ID}'
      AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.payment_method_id = pm.id)
      AND NOT EXISTS (SELECT 1 FROM account_transfers at WHERE at.from_payment_method_id = pm.id OR at.to_payment_method_id = pm.id)
      AND NOT EXISTS (SELECT 1 FROM recurring_transactions rt WHERE rt.payment_method_id = pm.id)
      AND NOT EXISTS (SELECT 1 FROM quick_actions qa WHERE qa.payment_method_id = pm.id)
  `)
}

export const shorthands = undefined