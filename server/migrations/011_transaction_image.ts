import type { MigrationBuilder } from 'node-pg-migrate'

export const up = (pgm: MigrationBuilder): void => {
  pgm.addColumns('transactions', {
    image_url: { type: 'text' },
  })
}

export const down = (pgm: MigrationBuilder): void => {
  pgm.dropColumns('transactions', ['image_url'])
}

export const shorthands = undefined
