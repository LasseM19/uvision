import { createApp } from './app.js'
import { getPort } from './config.js'
import { initDb } from './db/pool.js'
import { configureWebPush } from './services/pushService.js'
import { startCronJobs } from './services/cronService.js'

async function main() {
  await initDb()
  configureWebPush()
  startCronJobs()

  const app = createApp()
  const port = getPort()

  app.listen(port, () => {
    console.log(`[uvision-api] listening on port ${port}`)
  })
}

main().catch((err) => {
  console.error('[uvision-api] failed to start', err)
  process.exit(1)
})
