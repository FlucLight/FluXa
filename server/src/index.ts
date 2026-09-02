import app, { stopScheduledTasks } from './app'
import { env } from './config/env'
import { pool } from './config/db'
import { startTelegramBot } from './telegram/bot'

const server = app.listen(env.PORT, () => {
  console.log(`FluXa API listening on http://localhost:${env.PORT}`)
  startTelegramBot().catch((error) => console.error('[telegram] Startup error:', error))
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} sudah dipakai. Matikan proses lain atau ganti PORT di .env.`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})

let shuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n[${signal}] Menutup server...`)

  stopScheduledTasks()

  server.close(async () => {
    try {
      await pool.end()
      console.log('Koneksi database ditutup. Sampai jumpa!')
      process.exit(0)
    } catch (error) {
      console.error('Gagal menutup koneksi database:', error)
      process.exit(1)
    }
  })

  setTimeout(() => {
    console.error('Paksa keluar setelah timeout.')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))