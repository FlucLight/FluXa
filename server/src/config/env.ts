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

function toString(value: string | undefined, fallback: string): string {
  return value ?? fallback
}

function buildDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    `postgres://${toString(process.env.DB_USER, 'postgres')}:${encodeURIComponent(toString(process.env.DB_PASSWORD, ''))}@${toString(process.env.DB_HOST, 'localhost')}:${toNumber(process.env.DB_PORT, 5432)}/${toString(process.env.DB_NAME, 'financial_management')}`
  )
}

export const env: Env = {
  PORT: toNumber(process.env.PORT, 5000),
  DB_HOST: toString(process.env.DB_HOST, 'localhost'),
  DB_PORT: toNumber(process.env.DB_PORT, 5432),
  DB_USER: toString(process.env.DB_USER, 'postgres'),
  DB_PASSWORD: toString(process.env.DB_PASSWORD, ''),
  DB_NAME: toString(process.env.DB_NAME, 'financial_management'),
  DATABASE_URL: buildDatabaseUrl(),
  TELEGRAM_BOT_TOKEN: toString(process.env.TELEGRAM_BOT_TOKEN, ''),
  TELEGRAM_ALLOWED_CHAT_IDS: toString(process.env.TELEGRAM_ALLOWED_CHAT_IDS, ''),
  BACKUP_INTERVAL_HOURS: toNumber(process.env.BACKUP_INTERVAL_HOURS, 24),
  BACKUP_RETENTION_COUNT: toNumber(process.env.BACKUP_RETENTION_COUNT, 14),
  JWT_SECRET: toString(process.env.JWT_SECRET, ''),
  JWT_ACCESS_TTL_MINUTES: toNumber(process.env.JWT_ACCESS_TTL_MINUTES, 15),
  AUTH_SESSION_DAYS: toNumber(process.env.AUTH_SESSION_DAYS, 30),
  COOKIE_SECURE: process.env.COOKIE_SECURE !== 'false' && process.env.COOKIE_SECURE !== '0',
  PUBLIC_BASE: toString(process.env.PUBLIC_BASE, ''),
  CLIENT_ORIGIN: toString(process.env.CLIENT_ORIGIN, ''),
  GOOGLE_CLIENT_ID: toString(process.env.GOOGLE_CLIENT_ID, ''),
  GOOGLE_CLIENT_SECRET: toString(process.env.GOOGLE_CLIENT_SECRET, ''),
  SMTP_HOST: toString(process.env.SMTP_HOST, ''),
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_USER: toString(process.env.SMTP_USER, ''),
  SMTP_PASS: toString(process.env.SMTP_PASS, ''),
  SMTP_FROM: toString(process.env.SMTP_FROM, ''),
}