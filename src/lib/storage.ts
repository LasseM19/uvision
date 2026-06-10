import type {
  ActivityMode,
  ApplicationLog,
  HomeGeofenceRadius,
  HomeLocation,
  Location,
  SkinType,
  SpfLevel,
  StoredState,
  UserPreferences,
  ActiveTimer,
} from '../types'
import { DEFAULT_PREFERENCES } from '../types'

const STORAGE_KEY = 'uvision-state-v1'

function loadRaw(): Partial<StoredState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<StoredState>
  } catch {
    return {}
  }
}

export function loadState(): StoredState {
  const raw = loadRaw()
  return {
    preferences: { ...DEFAULT_PREFERENCES, ...raw.preferences },
    location: raw.location ?? null,
    homeLocation: raw.homeLocation ?? null,
    lastDepartureAlertDate: raw.lastDepartureAlertDate ?? null,
    locationPermissionDenied: raw.locationPermissionDenied ?? false,
    applicationLogs: raw.applicationLogs ?? [],
    activeTimer: raw.activeTimer
      ? { ...raw.activeTimer, snoozedUntil: raw.activeTimer.snoozedUntil ?? null }
      : null,
  }
}

export function saveState(partial: Partial<StoredState>): StoredState {
  const current = loadState()
  const next: StoredState = {
    preferences: partial.preferences ?? current.preferences,
    location: partial.location !== undefined ? partial.location : current.location,
    homeLocation: partial.homeLocation !== undefined ? partial.homeLocation : current.homeLocation,
    lastDepartureAlertDate:
      partial.lastDepartureAlertDate !== undefined
        ? partial.lastDepartureAlertDate
        : current.lastDepartureAlertDate,
    locationPermissionDenied:
      partial.locationPermissionDenied !== undefined
        ? partial.locationPermissionDenied
        : current.locationPermissionDenied,
    applicationLogs: partial.applicationLogs ?? current.applicationLogs,
    activeTimer: partial.activeTimer !== undefined ? partial.activeTimer : current.activeTimer,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function updatePreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const state = loadState()
  const preferences = { ...state.preferences, ...prefs }
  saveState({ preferences })
  return preferences
}

export function saveLocation(location: Location): Location {
  saveState({ location })
  return location
}

export function saveHomeLocation(home: HomeLocation): HomeLocation {
  saveState({ homeLocation: home })
  return home
}

export function clearHomeLocation(): void {
  saveState({ homeLocation: null })
}

export function markDepartureAlertSent(dateKey: string): void {
  saveState({ lastDepartureAlertDate: dateKey })
}

export function setLocationPermissionDenied(denied: boolean): void {
  saveState({ locationPermissionDenied: denied })
}

export function isLocationPermissionDenied(): boolean {
  return loadState().locationPermissionDenied
}

export function getLastDepartureAlertDate(): string | null {
  return loadState().lastDepartureAlertDate
}

export function getHomeGeofenceRadiusLabel(radius: HomeGeofenceRadius): string {
  return `${radius} m`
}

export function addApplicationLog(log: ApplicationLog): ApplicationLog[] {
  const state = loadState()
  const applicationLogs = [log, ...state.applicationLogs].slice(0, 100)
  saveState({ applicationLogs })
  return applicationLogs
}

export function removeApplicationLog(id: string): ApplicationLog[] {
  const state = loadState()
  const applicationLogs = state.applicationLogs.filter((log) => log.id !== id)
  saveState({ applicationLogs })
  return applicationLogs
}

export function setActiveTimer(timer: ActiveTimer | null): ActiveTimer | null {
  saveState({ activeTimer: timer })
  return timer
}

export function clearActiveTimer(): void {
  saveState({ activeTimer: null })
}

export function clearAllUserData(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('uvision-push-endpoint')
}

export function getSkinTypeLabel(type: SkinType): string {
  const labels: Record<SkinType, string> = {
    1: 'Very fair — burns easily',
    2: 'Fair — burns easily',
    3: 'Medium — sometimes burns',
    4: 'Olive — rarely burns',
    5: 'Brown — very rarely burns',
    6: 'Dark brown — almost never burns',
  }
  return labels[type]
}

export function getActivityLabel(mode: ActivityMode): string {
  const labels: Record<ActivityMode, string> = {
    normal: 'Normal',
    swimming: 'Swimming',
    sports: 'Sports / sweating',
  }
  return labels[mode]
}

export function getSpfLabel(spf: SpfLevel): string {
  return `SPF ${spf}${spf === 50 ? '+' : ''}`
}
