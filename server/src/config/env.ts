import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadDotenv } from 'dotenv'

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
  ]
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path })
      return
    }
  }
  loadDotenv()
}

loadEnv()

export interface Env {
  PORT: number
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PASSWORD: string
  DB_NAME: string
  DATABASE_URL: string
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env: Env = {
  PORT: toNumber(process.env.PORT, 5000),
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: toNumber(process.env.DB_PORT, 5432),
  DB_USER: process.env.DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: process.env.DB_NAME ?? 'financial_management',
  DATABASE_URL:
    process.env.DATABASE_URL ??
    `postgres://${process.env.DB_USER ?? 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${process.env.DB_HOST ?? 'localhost'}:${toNumber(process.env.DB_PORT, 5432)}/${process.env.DB_NAME ?? 'financial_management'}`,
}