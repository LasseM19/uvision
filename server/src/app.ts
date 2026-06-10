import express from 'express'
import cors from 'cors'
import { getCorsOrigins } from './config.js'
import { healthRouter } from './routes/health.js'
import { pushRouter } from './routes/push.js'

export function createApp() {
  const app = express()
  const origins = getCorsOrigins()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`CORS blocked for origin: ${origin}`))
      },
    }),
  )
  app.use(express.json())

  app.use(healthRouter)
  app.use(pushRouter)

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
