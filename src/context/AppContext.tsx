import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ActiveTimer,
  ActivityMode,
  ApplicationLog,
  HomeLocation,
  LivePosition,
  Location,
  SkinType,
  SpfLevel,
  UserPreferences,
} from '../types'
import { DEFAULT_PREFERENCES } from '../types'
import type { DepartureAlertCopy } from '../lib/notifications'
import {
  addApplicationLog,
  clearActiveTimer,
  clearAllUserData,
  clearHomeLocation as clearStoredHome,
  loadState,
  removeApplicationLog,
  saveHomeLocation,
  saveLocation,
  setActiveTimer,
  setLocationPermissionDenied,
  updatePreferences,
} from '../lib/storage'
import { unsubscribeFromBackendPush } from '../lib/pushBackend'
import { getCurrentEffectiveUv } from '../lib/currentUv'
import { useForecast } from '../hooks/useForecast'
import {
  buildTimerSchedule,
  calculateReapplyInterval,
  computeLiveTimerState,
  type TimerPhase,
} from '../lib/sunscreenTimer'
import { generateId } from '../lib/id'

interface ApplySunscreenInput {
  uv: number
  activityMode: ActivityMode
  skinType: SkinType
  spf: SpfLevel
  locationLabel: string
}

interface AppContextValue {
  preferences: UserPreferences
  location: Location | null
  homeLocation: HomeLocation | null
  livePosition: LivePosition | null
  liveTrackingEnabled: boolean
  locationPermissionDenied: boolean
  departureBanner: DepartureAlertCopy | null
  setPreferences: (prefs: Partial<UserPreferences>) => void
  setLocation: (location: Location) => void
  setHomeLocation: (home: HomeLocation) => void
  clearHomeLocation: () => void
  setLivePosition: (position: LivePosition | null) => void
  setLiveTrackingEnabled: (enabled: boolean) => void
  markLocationAccessGranted: () => void
  markLocationAccessDenied: () => void
  setDepartureBanner: (copy: DepartureAlertCopy | null) => void
  activeTimer: ActiveTimer | null
  phase: TimerPhase
  minutesLeft: number
  currentUv: number
  liveIntervalMinutes: number | null
  liveNextReapplyAt: Date | null
  forecastTimezone: string | null
  forecastTimezoneAbbreviation: string | null
  logs: ApplicationLog[]
  applySunscreen: (input: ApplySunscreenInput) => void
  deleteApplicationLog: (id: string) => void
  dismissTimer: () => void
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadState(), [])
  const [preferences, setPrefsState] = useState(initial.preferences)
  const [location, setLocState] = useState<Location | null>(initial.location)
  const [homeLocation, setHomeState] = useState<HomeLocation | null>(initial.homeLocation)
  const [livePosition, setLivePositionState] = useState<LivePosition | null>(null)
  const [liveTrackingEnabled, setLiveTrackingEnabledState] = useState(false)
  const [locationPermissionDenied, setLocationPermissionDeniedState] = useState(
    initial.locationPermissionDenied,
  )
  const [departureBanner, setDepartureBannerState] = useState<DepartureAlertCopy | null>(null)
  const [activeTimer, setLocalTimer] = useState<ActiveTimer | null>(initial.activeTimer)
  const [logs, setLogs] = useState<ApplicationLog[]>(initial.applicationLogs)
  const [tick, setTick] = useState(0)
  const { forecast } = useForecast(location)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const currentUv = useMemo(
    () =>
      getCurrentEffectiveUv(forecast?.hourlyToday, forecast?.daily[0]?.maxEffectiveUv ?? 0),
    [forecast],
  )

  const liveTimer = useMemo(() => {
    if (!activeTimer) return null
    return computeLiveTimerState(activeTimer, currentUv, preferences.skinType, preferences.spf)
  }, [activeTimer, currentUv, preferences.skinType, preferences.spf, tick])

  const phase = liveTimer?.phase ?? 'idle'
  const minutesLeft = liveTimer?.minutesLeft ?? 0
  const liveIntervalMinutes = liveTimer?.intervalMinutes ?? null
  const liveNextReapplyAt = liveTimer?.nextReapplyAt ?? null
  const forecastTimezone = forecast?.timezone ?? null
  const forecastTimezoneAbbreviation = forecast?.timezoneAbbreviation ?? null

  const setPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    const next = updatePreferences(prefs)
    setPrefsState(next)
  }, [])

  const setLocation = useCallback((loc: Location) => {
    saveLocation(loc)
    setLocState(loc)
  }, [])

  const setHomeLocation = useCallback((home: HomeLocation) => {
    saveHomeLocation(home)
    setHomeState(home)
  }, [])

  const clearHomeLocation = useCallback(() => {
    clearStoredHome()
    setHomeState(null)
    setDepartureBannerState(null)
  }, [])

  const setLivePosition = useCallback((position: LivePosition | null) => {
    setLivePositionState(position)
  }, [])

  const setLiveTrackingEnabled = useCallback((enabled: boolean) => {
    setLiveTrackingEnabledState(enabled)
    if (!enabled) {
      setLivePositionState(null)
    }
  }, [])

  const markLocationAccessGranted = useCallback(() => {
    setLocationPermissionDenied(false)
    setLocationPermissionDeniedState(false)
    setLiveTrackingEnabledState(true)
  }, [])

  const markLocationAccessDenied = useCallback(() => {
    setLocationPermissionDenied(true)
    setLocationPermissionDeniedState(true)
    setLiveTrackingEnabledState(false)
    setLivePositionState(null)
  }, [])

  const setDepartureBanner = useCallback((copy: DepartureAlertCopy | null) => {
    setDepartureBannerState(copy)
  }, [])

  const applySunscreen = useCallback((input: ApplySunscreenInput) => {
    const intervalMinutes = calculateReapplyInterval(
      input.uv,
      input.skinType,
      input.spf,
      input.activityMode,
    )

    if (intervalMinutes === null) {
      clearActiveTimer()
      setLocalTimer(null)
      return
    }

    const appliedAt = new Date()
    const { nextReapplyAt } = buildTimerSchedule(appliedAt, intervalMinutes)
    const timer: ActiveTimer = {
      appliedAt: appliedAt.toISOString(),
      intervalMinutes,
      activityMode: input.activityMode,
      uvAtApplication: input.uv,
      nextReapplyAt,
    }

    const log: ApplicationLog = {
      id: generateId(),
      appliedAt: timer.appliedAt,
      uvAtApplication: input.uv,
      activityMode: input.activityMode,
      locationLabel: input.locationLabel,
      intervalMinutes,
    }

    setActiveTimer(timer)
    setLocalTimer(timer)
    const nextLogs = addApplicationLog(log)
    setLogs(nextLogs)
    setDepartureBannerState(null)
  }, [])

  const dismissTimer = useCallback(() => {
    clearActiveTimer()
    setLocalTimer(null)
  }, [])

  const deleteApplicationLog = useCallback((id: string) => {
    const nextLogs = removeApplicationLog(id)
    setLogs(nextLogs)
  }, [])

  const logout = useCallback(async () => {
    try {
      await unsubscribeFromBackendPush()
    } catch {
      /* ignore */
    }
    clearAllUserData()
    setPrefsState({ ...DEFAULT_PREFERENCES, onboardingComplete: false })
    setLocState(null)
    setHomeState(null)
    setLivePositionState(null)
    setLiveTrackingEnabledState(false)
    setLocationPermissionDeniedState(false)
    setDepartureBannerState(null)
    setLocalTimer(null)
    setLogs([])
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      location,
      homeLocation,
      livePosition,
      liveTrackingEnabled,
      locationPermissionDenied,
      departureBanner,
      setPreferences,
      setLocation,
      setHomeLocation,
      clearHomeLocation,
      setLivePosition,
      setLiveTrackingEnabled,
      markLocationAccessGranted,
      markLocationAccessDenied,
      setDepartureBanner,
      activeTimer,
      phase,
      minutesLeft,
      currentUv,
      liveIntervalMinutes,
      liveNextReapplyAt,
      forecastTimezone,
      forecastTimezoneAbbreviation,
      logs,
      applySunscreen,
      deleteApplicationLog,
      dismissTimer,
      logout,
    }),
    [
      preferences,
      location,
      homeLocation,
      livePosition,
      liveTrackingEnabled,
      locationPermissionDenied,
      departureBanner,
      setPreferences,
      setLocation,
      setHomeLocation,
      clearHomeLocation,
      setLivePosition,
      setLiveTrackingEnabled,
      markLocationAccessGranted,
      markLocationAccessDenied,
      setDepartureBanner,
      activeTimer,
      phase,
      minutesLeft,
      currentUv,
      liveIntervalMinutes,
      liveNextReapplyAt,
      forecastTimezone,
      forecastTimezoneAbbreviation,
      logs,
      applySunscreen,
      deleteApplicationLog,
      dismissTimer,
      logout,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export { DEFAULT_PREFERENCES }
