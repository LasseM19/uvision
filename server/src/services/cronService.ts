import cron from 'node-cron'
import { pool } from '../db/pool.js'
import { isPushConfigured } from '../config.js'
import { sendPush } from './pushService.js'
import { fetchMaxEffectiveUvToday, morningAlertCopy } from './uvService.js'

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
  latitude: number | null
  longitude: number | null
  morning_check_time: string
  timezone: string
  last_morning_alert_date: string | null
}

function localTimeParts(timezone: string): { hour: string; minute: string; dateKey: string } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'

  return {
    hour: get('hour'),
    minute: get('minute'),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  }
}

export function startCronJobs(): void {
  if (!isPushConfigured()) {
    console.warn('[cron] Push not configured — morning reminders disabled')
    return
  }

  cron.schedule('* * * * *', () => {
    void runMorningChecks()
  })

  console.log('[cron] Morning UV reminders scheduled (every minute)')
}

async function runMorningChecks(): Promise<void> {
  const { rows } = await pool.query<SubscriptionRow>(
    `SELECT endpoint, p256dh, auth, latitude, longitude, morning_check_time, timezone, last_morning_alert_date
     FROM push_subscriptions
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL`,
  )

  for (const row of rows) {
    const { hour, minute, dateKey } = localTimeParts(row.timezone)
    const target = row.morning_check_time.slice(0, 5)

    if (`${hour}:${minute}` !== target) continue
    if (row.last_morning_alert_date === dateKey) continue

    try {
      const maxUv = await fetchMaxEffectiveUvToday(row.latitude!, row.longitude!)
      const copy = morningAlertCopy(maxUv)
      if (!copy) {
        await pool.query(
          `UPDATE push_subscriptions SET last_morning_alert_date = $1, updated_at = NOW() WHERE endpoint = $2`,
          [dateKey, row.endpoint],
        )
        continue
      }

      await sendPush(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        { ...copy, tag: 'uvision-morning' },
      )

      await pool.query(
        `UPDATE push_subscriptions SET last_morning_alert_date = $1, updated_at = NOW() WHERE endpoint = $2`,
        [dateKey, row.endpoint],
      )
    } catch (err) {
      console.error('[cron] Failed for subscription', row.endpoint.slice(0, 48), err)
    }
  }
}
