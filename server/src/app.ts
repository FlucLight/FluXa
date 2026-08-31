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
import { runDue } from './repositories/recurring'

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

app.use(notFoundHandler)
app.use(errorHandler)

function scheduleDailyRecurring(): void {
  const now = new Date()
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0)
  const msUntil = nextMidnight.getTime() - now.getTime()

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

export default app