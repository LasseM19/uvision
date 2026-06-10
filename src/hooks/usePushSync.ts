import { useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { isBackendConfigured } from '../lib/api'
import { syncPushPreferences } from '../lib/pushBackend'
import { useForecast } from './useForecast'

/** Keeps Railway push subscription in sync with local prefs. */
export function usePushSync() {
  const { preferences, location, homeLocation } = useAppContext()
  const { forecast } = useForecast(location)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!preferences.notificationsEnabled || !isBackendConfigured()) return

    if (timerRef.current) window.clearTimeout(timerRef.current)

    timerRef.current = window.setTimeout(() => {
      void syncPushPreferences({
        location,
        preferences,
        homeLocation,
        timezone: forecast?.timezone ?? null,
      }).catch(() => {
        /* silent — user may not have subscribed yet */
      })
    }, 500)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [
    preferences.notificationsEnabled,
    preferences.morningCheckTime,
    preferences.leaveHomeAlertsEnabled,
    location,
    homeLocation,
    forecast?.timezone,
  ])
}
