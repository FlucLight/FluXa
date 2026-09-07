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
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_ALLOWED_CHAT_IDS: string
  BACKUP_INTERVAL_HOURS: number
  BACKUP_RETENTION_COUNT: number
  JWT_SECRET: string
  JWT_ACCESS_TTL_MINUTES: number
  AUTH_SESSION_DAYS: number
  COOKIE_SECURE: boolean
  PUBLIC_BASE: string
  CLIENT_ORIGIN: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
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
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
  TELEGRAM_ALLOWED_CHAT_IDS: process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '',
  BACKUP_INTERVAL_HOURS: toNumber(process.env.BACKUP_INTERVAL_HOURS, 24),
  BACKUP_RETENTION_COUNT: toNumber(process.env.BACKUP_RETENTION_COUNT, 14),
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_ACCESS_TTL_MINUTES: toNumber(process.env.JWT_ACCESS_TTL_MINUTES, 15),
  AUTH_SESSION_DAYS: toNumber(process.env.AUTH_SESSION_DAYS, 30),
  COOKIE_SECURE: process.env.COOKIE_SECURE !== 'false' && process.env.COOKIE_SECURE !== '0',
  PUBLIC_BASE: process.env.PUBLIC_BASE ?? '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? '',
}