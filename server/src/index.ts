import app from './app'
import { env } from './config/env'

app.listen(env.PORT, () => {
  console.log(`Finance Tracker API listening on http://localhost:${env.PORT}`)
})