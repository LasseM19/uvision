export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator
}

/** Geolocation works on https:// and http://localhost — not on http://192.168.x.x */
export function isSecureContextForGeolocation(): boolean {
  if (typeof window === 'undefined') return true
  if (window.isSecureContext) return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

export type GeolocationPermission = 'granted' | 'denied' | 'prompt' | 'unknown'

export type LocationSettingsPlatform = 'ios-pwa' | 'ios-safari' | 'android' | 'other'

export interface LocationSettingsGuide {
  platform: LocationSettingsPlatform
  title: string
  steps: string[]
  settingsLabel: string
}

export function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isAndroidDevice(): boolean {
  return /Android/.test(navigator.userAgent)
}

export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function getLocationSettingsGuide(): LocationSettingsGuide {
  if (isIosDevice() && isStandalonePwa()) {
    return {
      platform: 'ios-pwa',
      title: 'Allow location for UVision',
      settingsLabel: 'Open iPhone Settings',
      steps: [
        'Tap "Open iPhone Settings" below',
        'Open Location (or Privacy & Security → Location Services)',
        'Choose "While Using the App" or "Allow"',
        'Return to UVision and tap "Try again"',
      ],
    }
  }

  if (isIosDevice()) {
    return {
      platform: 'ios-safari',
      title: 'Allow location for this website',
      settingsLabel: 'Open iPhone Settings',
      steps: [
        'Tap "Open iPhone Settings" below',
        'Go to Apps → Safari → Location',
        'Set to "Ask" or "Allow"',
        'Return to Safari, tap the address bar → Website Settings → Location → Allow',
        'Come back here and tap "Try again"',
      ],
    }
  }

  if (isAndroidDevice()) {
    return {
      platform: 'android',
      title: 'Allow location for this website',
      settingsLabel: 'Open phone settings',
      steps: [
        'Tap the lock icon next to the website address',
        'Open Permissions → Location → Allow',
        'Return to UVision and tap "Try again"',
      ],
    }
  }

  return {
    platform: 'other',
    title: 'Allow location for this website',
    settingsLabel: 'Open browser settings',
    steps: [
      'Open your browser settings for this site',
      'Find Location permissions and set to Allow',
      'Return here and tap "Try again"',
    ],
  }
}

/** Opens the device settings app where possible (iOS). */
export function openLocationSettings(): void {
  if (isIosDevice()) {
    window.location.href = 'app-settings:'
    return
  }

  if (isAndroidDevice()) {
    // Best-effort: opens Android settings; site permissions still need manual step in Chrome.
    window.location.href = 'intent://settings/#Intent;scheme=android-app;end'
  }
}

export function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED
}

export async function queryGeolocationPermission(): Promise<GeolocationPermission> {
  if (!isGeolocationSupported()) return 'unknown'
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state as GeolocationPermission
  } catch {
    return 'unknown'
  }
}

export function geolocationErrorMessage(error: unknown): string {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access was blocked. Allow location for this site in your browser settings, or search for your city below.'
      case error.POSITION_UNAVAILABLE:
        return 'Your device could not determine a location. Try again outdoors or search for your city below.'
      case error.TIMEOUT:
        return 'Finding your location took too long. Try again or search for your city below.'
      default:
        break
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('not supported')) {
      return 'Location is not supported in this browser. Search for your city below.'
    }
    return error.message
  }

  return 'Could not get your location. Search for your city below.'
}

export function insecureContextMessage(): string {
  const host = window.location.host
  return `Location only works on a secure connection. Open the app via http://localhost:5173 instead of http://${host}.`
}

interface PositionOptions {
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/** Try a quick cached/low-accuracy fix first, then high-accuracy GPS. */
export async function getCurrentPositionWithRetry(): Promise<GeolocationPosition> {
  if (!isGeolocationSupported()) {
    throw new Error('Geolocation is not supported on this device.')
  }

  if (!isSecureContextForGeolocation()) {
    throw new Error(insecureContextMessage())
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 600_000 },
    { enableHighAccuracy: true, timeout: 25_000, maximumAge: 0 },
  ]

  let lastError: unknown
  for (const options of attempts) {
    try {
      return await getPosition(options)
    } catch (err) {
      lastError = err
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        throw err
      }
    }
  }

  throw lastError ?? new Error('Could not get your location.')
}
