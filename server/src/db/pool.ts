import pg from 'pg'
import { getOptionalEnv } from '../config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: getOptionalEnv('DATABASE_URL'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      morning_check_time TEXT NOT NULL DEFAULT '08:00',
      leave_home_alerts BOOLEAN NOT NULL DEFAULT FALSE,
      home_latitude DOUBLE PRECISION,
      home_longitude DOUBLE PRECISION,
      home_radius_m INTEGER,
      timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
      last_morning_alert_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}
