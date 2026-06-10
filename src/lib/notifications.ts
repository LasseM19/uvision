import { uvRiskLabel } from './uvLogic'

export interface DepartureAlertInput {
  maxUv: number
  hasActiveProtection: boolean
  minutesLeft: number
}

export interface DepartureAlertCopy {
  title: string
  body: string
}

export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!canUseNotifications()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/** Returns null when no alert should be shown (UV too low). */
export function getDepartureAlertCopy(input: DepartureAlertInput): DepartureAlertCopy | null {
  const { maxUv, hasActiveProtection, minutesLeft } = input

  if (maxUv < 3) return null

  if (hasActiveProtection && minutesLeft > 0) {
    return {
      title: 'You left home',
      body: `Your sunscreen timer is still active — about ${minutesLeft} min of protection left.`,
    }
  }

  const risk = uvRiskLabel(maxUv).toLowerCase()

  if (maxUv >= 6) {
    return {
      title: 'Headed out?',
      body: `You're away from home and UV is ${risk} today (max ${maxUv}). Don't forget sunscreen if you'll be outside.`,
    }
  }

  return {
    title: 'Headed out?',
    body: `You're away from home. UV is ${risk} today (max ${maxUv}) — consider sunscreen if you'll be outside for a while.`,
  }
}

export function showDepartureNotification(copy: DepartureAlertCopy): void {
  if (!canUseNotifications() || Notification.permission !== 'granted') return

  try {
    new Notification(copy.title, {
      body: copy.body,
      tag: 'uvision-departure',
      icon: '/pwa-192.png',
    })
  } catch {
    /* ignore — some browsers block without user gesture */
  }
}
