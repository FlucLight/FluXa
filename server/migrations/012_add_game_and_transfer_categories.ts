import type { MigrationBuilder } from 'node-pg-migrate'

const OWNER_ID = 'a0000000-0000-0000-0000-000000000001'

export const up = (pgm: MigrationBuilder): void => {
  // 1. Tambahkan kategori baru ke akun owner
  pgm.sql(`
    INSERT INTO categories (user_id, name, type, icon, keywords)
    VALUES
      ('${OWNER_ID}', 'Game & Top Up', 'expense', '🎮', '{game,top up,topup,diamond,steam,playstation,roblox,ml,mlbb,ff,free fire,genshin,valorant,codashop,itemku,unipin,langganan,netflix,spotify,playstore}'),
      ('${OWNER_ID}', 'Transfer Keluar', 'expense', '📤', '{transfer,tf,kirim,send,bayar hutang,top up orang}')
    ON CONFLICT (user_id, name, type) DO NOTHING;
  `)

  // 2. Duplikasi ke seluruh user lain yang sudah terdaftar
  pgm.sql(`
    INSERT INTO categories (user_id, name, type, icon, keywords)
    SELECT u.id, c.name, c.type, c.icon, c.keywords
    FROM users u
    JOIN categories c ON c.user_id = '${OWNER_ID}' AND c.name IN ('Game & Top Up', 'Transfer Keluar')
    WHERE u.id <> '${OWNER_ID}'
      AND NOT EXISTS (
        SELECT 1 FROM categories cc
        WHERE cc.user_id = u.id AND cc.name = c.name AND cc.type = c.type
      )
    ON CONFLICT (user_id, name, type) DO NOTHING;
  `)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.sql(`
    DELETE FROM categories
    WHERE name IN ('Game & Top Up', 'Transfer Keluar')
      AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.category_id = categories.id);
  `)
}

export const shorthands = undefined
