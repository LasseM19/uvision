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
      secondaryActionLabel: 'Use my current location',
      steps: [
        'Tap "Open iPhone Settings" below',
        'Scroll to UVision in the app list',
        'Tap Location → choose "While Using the App"',
        'Return to UVision and tap "Use my current location"',
      ],
    }
  }

  if (isIosDevice()) {
    return {
      platform: 'ios-safari',
      title: 'Allow location in Safari',
      primaryActionLabel: 'Open iPhone Settings',
      secondaryActionLabel: 'Use my current location',
      steps: [
        'In Safari, tap the icon to the left of the address bar (Aa or sliders icon)',
        'Tap "Website Settings" (or "Settings for This Website")',
        'Tap Location → choose "Allow" (not "Deny" or "Ask")',
        'Return to this page and tap "Use my current location" below',
      ],
    }
  }

  if (isAndroidDevice()) {
    return {
      platform: 'android',
      title: 'Allow location for this website',
      primaryActionLabel: 'Open phone settings',
      secondaryActionLabel: 'Use my current location',
      steps: [
        'Tap the lock icon next to the website address',
        'Open Permissions → Location → Allow',
        'Return to UVision and tap "Use my current location"',
      ],
    }
  }

  return {
    platform: 'other',
    title: 'Allow location for this website',
    primaryActionLabel: 'Open browser settings',
    secondaryActionLabel: 'Use my current location',
    steps: [
      'Open your browser settings for this site',
      'Find Location permissions and set to Allow',
      'Return here and tap "Use my current location"',
    ],
  }
}

/** Opens device settings where it helps. Safari browser users must use Website Settings in-page. */
export function openLocationSettings(): void {
  if (isIosDevice() && isStandalonePwa()) {
    window.location.href = 'app-settings:'
    return
  }

  if (isAndroidDevice()) {
    window.location.href = 'intent://settings/#Intent;scheme=android-app;end'
  }
}

export function canOpenSystemLocationSettings(): boolean {
  return (isIosDevice() && isStandalonePwa()) || isAndroidDevice()
}

export function isPermissionDeniedError(error: unknown): boolean {
  if (typeof GeolocationPositionError === 'undefined') {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 1
    )
  }
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
  if (typeof GeolocationPositionError !== 'undefined' && error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access is blocked for this website. Follow the steps below, then use "Use my current location".'
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

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timer))
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export async function getCurrentPositionWithRetry(): Promise<GeolocationPosition> {
  if (!isGeolocationSupported()) {
    throw new Error('Geolocation is not supported on this device.')
  }

  if (!isSecureContextForGeolocation()) {
    throw new Error(insecureContextMessage())
  }

  const attempts: PositionOptions[] = isIosDevice()
    ? [
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
      ]
    : [
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
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
    const response = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
      6000,
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

export async function ensureGeolocationAccess(): Promise<GeolocationPosition> {
  return getCurrentPositionWithRetry()
}

export async function resolveCurrentLocation(): Promise<Location> {
  const position = await getCurrentPositionWithRetry()
  const { latitude, longitude } = position.coords
  const label = await reverseGeocodeLabel(latitude, longitude)
  return { latitude, longitude, label }
}

export interface WatchPositionOptions {
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
}

export function watchGeolocationPosition(
  onUpdate: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError) => void,
  options: WatchPositionOptions = {},
): () => void {
  if (!isGeolocationSupported() || !isSecureContextForGeolocation()) {
    return () => undefined
  }

  const watchId = navigator.geolocation.watchPosition(
    onUpdate,
    onError,
    {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      maximumAge: options.maximumAge ?? 30_000,
      timeout: options.timeout ?? 15_000,
    },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
