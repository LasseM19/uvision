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
  Location,
  SkinType,
  SpfLevel,
  UserPreferences,
} from '../types'
import { DEFAULT_PREFERENCES } from '../types'
import {
  addApplicationLog,
  clearActiveTimer,
  loadState,
  saveLocation,
  setActiveTimer,
  updatePreferences,
} from '../lib/storage'
import {
  buildTimerSchedule,
  calculateReapplyInterval,
  getTimerPhase,
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
  setPreferences: (prefs: Partial<UserPreferences>) => void
  setLocation: (location: Location) => void
  activeTimer: ActiveTimer | null
  phase: TimerPhase
  minutesLeft: number
  logs: ApplicationLog[]
  applySunscreen: (input: ApplySunscreenInput) => void
  dismissTimer: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadState(), [])
  const [preferences, setPrefsState] = useState(initial.preferences)
  const [location, setLocState] = useState<Location | null>(initial.location)
  const [activeTimer, setLocalTimer] = useState<ActiveTimer | null>(initial.activeTimer)
  const [logs, setLogs] = useState<ApplicationLog[]>(initial.applicationLogs)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const phase = activeTimer ? getTimerPhase(activeTimer.nextReapplyAt) : 'idle'
  const minutesLeft = activeTimer
    ? Math.max(0, Math.round((new Date(activeTimer.nextReapplyAt).getTime() - Date.now()) / 60_000))
    : 0

  const setPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    const next = updatePreferences(prefs)
    setPrefsState(next)
  }, [])

  const setLocation = useCallback((loc: Location) => {
    saveLocation(loc)
    setLocState(loc)
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
  }, [])

  const dismissTimer = useCallback(() => {
    clearActiveTimer()
    setLocalTimer(null)
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      location,
      setPreferences,
      setLocation,
      activeTimer,
      phase,
      minutesLeft,
      logs,
      applySunscreen,
      dismissTimer,
    }),
    [
      preferences,
      location,
      setPreferences,
      setLocation,
      activeTimer,
      phase,
      minutesLeft,
      logs,
      applySunscreen,
      dismissTimer,
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
