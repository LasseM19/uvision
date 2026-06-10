import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { isPushConfigured } from '../config.js'
import { sendPush } from '../services/pushService.js'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

const homeSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    radiusMeters: z.number().int().positive(),
  })
  .optional()
  .nullable()

const subscribeSchema = z.object({
  subscription: subscriptionSchema,
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  morningCheckTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  leaveHomeAlertsEnabled: z.boolean().optional(),
  timezone: z.string().optional(),
  home: homeSchema,
})

const updateSchema = z.object({
  endpoint: z.string().url(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  morningCheckTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  leaveHomeAlertsEnabled: z.boolean().optional(),
  timezone: z.string().optional(),
  home: homeSchema,
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

export const pushRouter = Router()

pushRouter.post('/api/push/subscribe', async (req, res) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: 'Push notifications are not configured on the server.' })
    return
  }

  const parsed = subscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { subscription, ...prefs } = parsed.data

  await pool.query(
    `INSERT INTO push_subscriptions (
      endpoint, p256dh, auth, latitude, longitude, morning_check_time,
      leave_home_alerts, home_latitude, home_longitude, home_radius_m, timezone, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (endpoint) DO UPDATE SET
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      morning_check_time = EXCLUDED.morning_check_time,
      leave_home_alerts = EXCLUDED.leave_home_alerts,
      home_latitude = EXCLUDED.home_latitude,
      home_longitude = EXCLUDED.home_longitude,
      home_radius_m = EXCLUDED.home_radius_m,
      timezone = EXCLUDED.timezone,
      updated_at = NOW()`,
    [
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      prefs.latitude ?? null,
      prefs.longitude ?? null,
      prefs.morningCheckTime ?? '08:00',
      prefs.leaveHomeAlertsEnabled ?? false,
      prefs.home?.latitude ?? null,
      prefs.home?.longitude ?? null,
      prefs.home?.radiusMeters ?? null,
      prefs.timezone ?? 'Europe/Amsterdam',
    ],
  )

  res.status(201).json({ ok: true })
})

pushRouter.put('/api/push/subscription', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { endpoint, home, ...prefs } = parsed.data

  const result = await pool.query(
    `UPDATE push_subscriptions SET
      latitude = COALESCE($2, latitude),
      longitude = COALESCE($3, longitude),
      morning_check_time = COALESCE($4, morning_check_time),
      leave_home_alerts = COALESCE($5, leave_home_alerts),
      home_latitude = $6,
      home_longitude = $7,
      home_radius_m = $8,
      timezone = COALESCE($9, timezone),
      updated_at = NOW()
    WHERE endpoint = $1`,
    [
      endpoint,
      prefs.latitude ?? null,
      prefs.longitude ?? null,
      prefs.morningCheckTime ?? null,
      prefs.leaveHomeAlertsEnabled ?? null,
      home?.latitude ?? null,
      home?.longitude ?? null,
      home?.radiusMeters ?? null,
      prefs.timezone ?? null,
    ],
  )

  if (result.rowCount === 0) {
    res.status(404).json({ error: 'Subscription not found' })
    return
  }

  res.json({ ok: true })
})

pushRouter.delete('/api/push/subscribe', async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [parsed.data.endpoint])
  res.json({ ok: true })
})

pushRouter.post('/api/push/test', async (req, res) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: 'Push not configured' })
    return
  }

  const parsed = unsubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { rows } = await pool.query<{ p256dh: string; auth: string }>(
    'SELECT p256dh, auth FROM push_subscriptions WHERE endpoint = $1',
    [parsed.data.endpoint],
  )

  if (rows.length === 0) {
    res.status(404).json({ error: 'Subscription not found' })
    return
  }

  await sendPush(
    {
      endpoint: parsed.data.endpoint,
      keys: { p256dh: rows[0].p256dh, auth: rows[0].auth },
    },
    {
      title: 'UVision test',
      body: 'Push notifications from Railway are working.',
      tag: 'uvision-test',
    },
  )

  res.json({ ok: true })
})
