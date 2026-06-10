import type { Location } from '../types'

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
  primaryActionLabel: string
  secondaryActionLabel: string
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

/** iOS Safari's Permissions API is unreliable — never use it alone for UI state. */
export function shouldTrustPermissionsApi(): boolean {
  return !isIosDevice()
}

export function getLocationSettingsGuide(): LocationSettingsGuide {
  if (isIosDevice() && isStandalonePwa()) {
    return {
      platform: 'ios-pwa',
      title: 'Allow location for UVision',
      primaryActionLabel: 'Open iPhone Settings',
      secondaryActionLabel: 'Try again',
      steps: [
        'Tap "Open iPhone Settings" below',
        'Scroll to UVision in the app list',
        'Tap Location → choose "While Using the App"',
        'Return to UVision and tap "Try again"',
      ],
    }
  }

  if (isIosDevice()) {
    return {
      platform: 'ios-safari',
      title: 'Allow location in Safari',
      primaryActionLabel: 'Open iPhone Settings',
      secondaryActionLabel: 'Try again',
      steps: [
        'In Safari, tap the icon to the left of the address bar (Aa or sliders icon)',
        'Tap "Website Settings" (or "Settings for This Website")',
        'Tap Location → choose "Allow" (not "Deny" or "Ask")',
        'Also check: iPhone Settings → Apps → Safari → Location → "Ask" or "Allow"',
        'Return to this page and tap "Try again"',
      ],
    }
  }

  if (isAndroidDevice()) {
    return {
      platform: 'android',
      title: 'Allow location for this website',
      primaryActionLabel: 'Open phone settings',
      secondaryActionLabel: 'Try again',
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
    primaryActionLabel: 'Open browser settings',
    secondaryActionLabel: 'Try again',
    steps: [
      'Open your browser settings for this site',
      'Find Location permissions and set to Allow',
      'Return here and tap "Try again"',
    ],
  }
}

/** Opens the iOS Settings app (works for PWA; Safari users still need Website Settings). */
export function openLocationSettings(): void {
  if (isIosDevice()) {
    window.location.assign('app-settings:')
    return
  }

  if (isAndroidDevice()) {
    window.location.assign('intent://settings/#Intent;scheme=android-app;end')
  }
}

export function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED
}

export async function queryGeolocationPermission(): Promise<GeolocationPermission> {
  if (!isGeolocationSupported() || !shouldTrustPermissionsApi()) return 'unknown'
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
        return 'Location access is blocked for this website. Follow the steps below, then tap Try again.'
      case error.POSITION_UNAVAILABLE:
        return 'Your device could not determine a location. Check that Location Services is on, or search for your city below.'
      case error.TIMEOUT:
        return 'Finding your location took too long. Move near a window or search for your city below.'
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
  return `Location only works on a secure connection. Open the app via https:// or http://localhost:5173 instead of http://${host}.`
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

/** watchPosition is more reliable on iOS Safari than a single getCurrentPosition call. */
function getPositionViaWatch(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }

    let settled = false
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      fn()
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        navigator.geolocation.clearWatch(watchId)
        finish(() => resolve(position))
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId)
        finish(() => reject(error))
      },
      options,
    )

    window.setTimeout(() => {
      navigator.geolocation.clearWatch(watchId)
      finish(() =>
        reject(Object.assign(new Error('Location request timed out.'), { code: 3 })),
      )
    }, options.timeout + 500)
  })
}

export async function getCurrentPositionWithRetry(): Promise<GeolocationPosition> {
  if (!isGeolocationSupported()) {
    throw new Error('Geolocation is not supported on this device.')
  }

  if (!isSecureContextForGeolocation()) {
    throw new Error(insecureContextMessage())
  }

  if (isIosDevice()) {
    const iosAttempts: PositionOptions[] = [
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
    ]

    let lastError: unknown
    for (const options of iosAttempts) {
      try {
        return await getPositionViaWatch(options)
      } catch (err) {
        lastError = err
        if (isPermissionDeniedError(err)) throw err
      }
    }
    throw lastError ?? new Error('Could not get your location.')
  }

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
  ]

  let lastError: unknown
  for (const options of attempts) {
    try {
      return await getPosition(options)
    } catch (err) {
      lastError = err
      if (isPermissionDeniedError(err)) throw err
    }
  }

  throw lastError ?? new Error('Could not get your location.')
}

export async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string> {
  const fallback = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`

  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'en',
    })
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!response.ok) return fallback

    const data = (await response.json()) as {
      city?: string
      locality?: string
      principalSubdivision?: string
      countryName?: string
    }

    const label = [data.city || data.locality, data.principalSubdivision, data.countryName]
      .filter(Boolean)
      .join(', ')

    return label || fallback
  } catch {
    return fallback
  }
}

export async function resolveCurrentLocation(): Promise<Location> {
  const position = await getCurrentPositionWithRetry()
  const { latitude, longitude } = position.coords
  const label = await reverseGeocodeLabel(latitude, longitude)
  return { latitude, longitude, label }
}
