import cors from 'cors'
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
import { runDue } from './repositories/recurring'
import { backupIntervalMs, createBackup } from './services/backup'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

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

function scheduleDailyRecurring(): void {
  const msUntil = nextWitaMidnight().getTime() - Date.now()

  setTimeout(async () => {
    try {
      const n = await runDue()
      if (n > 0) console.log(`[recurring] Generated ${n} transaction(s)`)
    } catch (e) {
      console.error('[recurring] Error:', e)
    }
    scheduleDailyRecurring()
  }, msUntil)

  runDue().then(n => { if (n > 0) console.log(`[recurring] Startup: generated ${n}`) }).catch(() => {})
}

scheduleDailyRecurring()

function scheduleBackup(): void {
  const interval = backupIntervalMs()
  setTimeout(async () => {
    try {
      const filepath = await createBackup()
      console.log(`[backup] Created ${filepath}`)
    } catch (error) {
      console.error('[backup] Error:', error)
    }
    scheduleBackup()
  }, interval)
}

createBackup()
  .then((filepath) => console.log(`[backup] Created ${filepath}`))
  .catch((error) => console.error('[backup] Startup error:', error))
scheduleBackup()

export default app