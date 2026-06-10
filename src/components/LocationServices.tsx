import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DepartureBanner } from './DepartureBanner'
import { useAppContext } from '../context/AppContext'
import { useForecast } from '../hooks/useForecast'
import { useLivePosition } from '../hooks/useLivePosition'
import { isWithinHomeRadius, todayDateKey } from '../lib/geofence'
import { getDepartureAlertCopyForLang } from '../i18n'
import { showDepartureNotification } from '../lib/notifications'
import { getLastDepartureAlertDate, markDepartureAlertSent } from '../lib/storage'

export function LocationServices() {
  const navigate = useNavigate()
  const {
    homeLocation,
    preferences,
    location,
    liveTrackingEnabled,
    markLocationAccessDenied,
    setLivePosition,
    activeTimer,
    minutesLeft,
    departureBanner,
    setDepartureBanner,
  } = useAppContext()

  const handlePermissionDenied = useCallback(() => {
    markLocationAccessDenied()
  }, [markLocationAccessDenied])

  const trackingEnabled =
    liveTrackingEnabled && Boolean(homeLocation && preferences.leaveHomeAlertsEnabled)

  const { position } = useLivePosition({
    enabled: trackingEnabled,
    onPermissionDenied: handlePermissionDenied,
  })
  const { forecast } = useForecast(location, preferences.language)
  const wasAtHomeRef = useRef<boolean | null>(null)

  useEffect(() => {
    setLivePosition(position)
  }, [position, setLivePosition])

  useEffect(() => {
    if (!homeLocation || !position || !preferences.leaveHomeAlertsEnabled) return

    const atHome = isWithinHomeRadius(position.latitude, position.longitude, homeLocation)
    const wasAtHome = wasAtHomeRef.current

    if (wasAtHome === true && !atHome) {
      const maxUv = forecast?.daily[0]?.maxEffectiveUv ?? 0
      const hasActiveProtection = Boolean(activeTimer && minutesLeft > 0)
      const copy = getDepartureAlertCopyForLang(preferences.language, {
        maxUv,
        hasActiveProtection,
        minutesLeft,
      })

      if (!copy) {
        wasAtHomeRef.current = atHome
        return
      }

      const today = todayDateKey()
      if (getLastDepartureAlertDate() === today) {
        wasAtHomeRef.current = atHome
        return
      }

      markDepartureAlertSent(today)
      setDepartureBanner(copy)

      if (preferences.notificationsEnabled) {
        showDepartureNotification(copy)
      }
    }

    wasAtHomeRef.current = atHome
  }, [
    homeLocation,
    position,
    preferences.language,
    preferences.leaveHomeAlertsEnabled,
    preferences.notificationsEnabled,
    forecast,
    activeTimer,
    minutesLeft,
    setDepartureBanner,
  ])

  useEffect(() => {
    if (!homeLocation) {
      wasAtHomeRef.current = null
    }
  }, [homeLocation])

  if (!departureBanner) return null

  return (
    <DepartureBanner
      copy={departureBanner}
      onDismiss={() => setDepartureBanner(null)}
      onApply={() => {
        setDepartureBanner(null)
        navigate('/timer')
      }}
    />
  )
}
