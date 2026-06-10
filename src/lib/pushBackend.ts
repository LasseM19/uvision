import { apiFetch, isBackendConfigured } from './api'
import type { HomeLocation, Location, UserPreferences } from '../types'

const PUSH_ENDPOINT_KEY = 'uvision-push-endpoint'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

export function getStoredPushEndpoint(): string | null {
  try {
    return localStorage.getItem(PUSH_ENDPOINT_KEY)
  } catch {
    return null
  }
}

function storePushEndpoint(endpoint: string): void {
  localStorage.setItem(PUSH_ENDPOINT_KEY, endpoint)
}

function clearPushEndpoint(): void {
  localStorage.removeItem(PUSH_ENDPOINT_KEY)
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.')
  }

  return navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
}

export interface PushRegistrationInput {
  location: Location | null
  preferences: UserPreferences
  homeLocation: HomeLocation | null
}

export async function subscribeToBackendPush(
  input: PushRegistrationInput,
): Promise<string | null> {
  if (!isBackendConfigured()) return null
  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  const { publicKey } = await apiFetch<{ publicKey: string }>('/api/push/vapid-public-key')
  const registration = await registerPushServiceWorker()
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Could not create push subscription.')
  }

  await apiFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      subscription: {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      },
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      morningCheckTime: input.preferences.morningCheckTime,
      leaveHomeAlertsEnabled: input.preferences.leaveHomeAlertsEnabled,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      home: input.homeLocation
        ? {
            latitude: input.homeLocation.latitude,
            longitude: input.homeLocation.longitude,
            radiusMeters: input.homeLocation.radiusMeters,
          }
        : null,
    }),
  })

  storePushEndpoint(json.endpoint)
  return json.endpoint
}

export async function syncPushPreferences(input: PushRegistrationInput): Promise<void> {
  if (!isBackendConfigured()) return

  const endpoint = getStoredPushEndpoint()
  if (!endpoint) return

  await apiFetch('/api/push/subscription', {
    method: 'PUT',
    body: JSON.stringify({
      endpoint,
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      morningCheckTime: input.preferences.morningCheckTime,
      leaveHomeAlertsEnabled: input.preferences.leaveHomeAlertsEnabled,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      home: input.homeLocation
        ? {
            latitude: input.homeLocation.latitude,
            longitude: input.homeLocation.longitude,
            radiusMeters: input.homeLocation.radiusMeters,
          }
        : null,
    }),
  })
}

export async function unsubscribeFromBackendPush(): Promise<void> {
  const endpoint = getStoredPushEndpoint()
  if (endpoint && isBackendConfigured()) {
    try {
      await apiFetch('/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
      })
    } catch {
      /* ignore */
    }
  }

  clearPushEndpoint()

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/push-sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    await subscription?.unsubscribe()
  }
}

export async function sendTestPush(): Promise<void> {
  const endpoint = getStoredPushEndpoint()
  if (!endpoint) throw new Error('No push subscription found.')

  await apiFetch('/api/push/test', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  })
}
