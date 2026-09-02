import app from './app'
import { env } from './config/env'
import { startTelegramBot } from './telegram/bot'

app.listen(env.PORT, () => {
  console.log(`FluXa API listening on http://localhost:${env.PORT}`)
  startTelegramBot().catch((error) => console.error('[telegram] Startup error:', error))
})