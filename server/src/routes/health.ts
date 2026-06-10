import { Router } from 'express'
import { getVapidPublicKey } from '../services/pushService.js'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'uvision-api' })
})

healthRouter.get('/api/push/vapid-public-key', (_req, res) => {
  const publicKey = getVapidPublicKey()
  if (!publicKey) {
    res.status(503).json({ error: 'Push notifications are not configured on the server.' })
    return
  }
  res.json({ publicKey })
})
