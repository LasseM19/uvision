import webpush from 'web-push'
import { getOptionalEnv, isPushConfigured } from '../config.js'

let configured = false

export function configureWebPush(): void {
  if (!isPushConfigured() || configured) return

  webpush.setVapidDetails(
    getOptionalEnv('VAPID_SUBJECT'),
    getOptionalEnv('VAPID_PUBLIC_KEY'),
    getOptionalEnv('VAPID_PRIVATE_KEY'),
  )
  configured = true
}

export function getVapidPublicKey(): string | null {
  const key = getOptionalEnv('VAPID_PUBLIC_KEY')
  return key || null
}

export interface PushPayload {
  title: string
  body: string
  tag?: string
}

export async function sendPush(
  subscription: webpush.PushSubscription,
  payload: PushPayload,
): Promise<void> {
  configureWebPush()
  await webpush.sendNotification(subscription, JSON.stringify(payload))
}
