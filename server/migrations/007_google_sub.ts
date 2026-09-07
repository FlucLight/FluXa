import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns('users', {
    google_sub: { type: 'text' },
  })
  pgm.sql(`CREATE UNIQUE INDEX users_google_sub_key ON users (google_sub) WHERE google_sub IS NOT NULL`)
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.sql('DROP INDEX IF EXISTS users_google_sub_key')
  pgm.dropColumns('users', ['google_sub'])
}

export const shorthands = undefined