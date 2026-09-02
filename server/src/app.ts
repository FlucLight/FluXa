import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import categoriesRouter from './routes/categories'
import paymentMethodsRouter from './routes/paymentMethods'
import transactionsRouter from './routes/transactions'
import transfersRouter from './routes/transfers'
import budgetsRouter from './routes/budgets'
import recurringRouter from './routes/recurring'
import exportRouter from './routes/export'
import summaryRouter from './routes/summary'
import profileRouter from './routes/profile'
import path from 'node:path'
import { runDue } from './repositories/recurring'
import { backupIntervalMs, createBackup } from './services/backup'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(compression())
app.use(morgan('dev'))

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(null, false)
  },
}))

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))

app.use(express.json({ limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api/categories', categoriesRouter)
app.use('/api/payment-methods', paymentMethodsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/transfers', transfersRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/recurring-transactions', recurringRouter)
app.use('/api/export', exportRouter)
app.use('/api/summary', summaryRouter)
app.use('/api/profile', profileRouter)

app.use(notFoundHandler)
app.use(errorHandler)

function nextWitaMidnight(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const next = new Date(`${values['year']}-${values['month']}-${values['day']}T00:01:00+08:00`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next
}

const recurringTimer: ReturnType<typeof setTimeout>[] = []
const backupTimer: ReturnType<typeof setTimeout>[] = []

function scheduleDailyRecurring(): void {
  const msUntil = nextWitaMidnight().getTime() - Date.now()

  const timer = setTimeout(async () => {
    try {
      const n = await runDue()
      if (n > 0) console.log(`[recurring] Generated ${n} transaction(s)`)
    } catch (e) {
      console.error('[recurring] Error:', e)
    }
    scheduleDailyRecurring()
  }, msUntil)
  recurringTimer.push(timer)

  runDue().then(n => { if (n > 0) console.log(`[recurring] Startup: generated ${n}`) }).catch(() => {})
}

function scheduleBackup(): void {
  const interval = backupIntervalMs()
  const timer = setTimeout(async () => {
    try {
      const filepath = await createBackup()
      console.log(`[backup] Created ${filepath}`)
    } catch (error) {
      console.error('[backup] Error:', error)
    }
    scheduleBackup()
  }, interval)
  backupTimer.push(timer)
}

export function stopScheduledTasks(): void {
  for (const t of recurringTimer) clearTimeout(t)
  for (const t of backupTimer) clearTimeout(t)
  recurringTimer.length = 0
  backupTimer.length = 0
}

createBackup()
  .then((filepath) => console.log(`[backup] Created ${filepath}`))
  .catch((error) => console.error('[backup] Startup error:', error))
scheduleBackup()
scheduleDailyRecurring()

export default app