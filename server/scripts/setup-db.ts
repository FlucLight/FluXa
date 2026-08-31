import { Client } from 'pg'
import { env } from '../src/config/env'

async function setupDatabase(): Promise<void> {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: 'postgres',
  })

  await client.connect()
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.DB_NAME])
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${env.DB_NAME}"`)
      console.log(`Database "${env.DB_NAME}" created.`)
    } else {
      console.log(`Database "${env.DB_NAME}" already exists.`)
    }
  } finally {
    await client.end()
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })