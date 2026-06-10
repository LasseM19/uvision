import { useEffect, useRef } from 'react'
import { Button } from './Button'
import { SwipeToSnoozeSlider } from './SwipeToSnoozeSlider'
import { useAppContext } from '../context/AppContext'
import { formatTimeInZone } from '../lib/timezone'
import { REAPPLY_SNOOZE_MINUTES } from '../lib/sunscreenTimer'

export function ReapplyAlarmOverlay() {
  const {
    reapplyAlarmActive,
    activeTimer,
    liveNextReapplyAt,
    forecastTimezone,
    forecastTimezoneAbbreviation,
    snoozeReapplyAlarm,
    applySunscreen,
    location,
    preferences,
    currentUv,
  } = useAppContext()
  const vibratedRef = useRef(false)

  useEffect(() => {
    if (!reapplyAlarmActive) {
      vibratedRef.current = false
      return
    }

    if (vibratedRef.current) return
    vibratedRef.current = true

    if ('vibrate' in navigator) {
      navigator.vibrate([180, 120, 180])
    }
  }, [reapplyAlarmActive])

  if (!reapplyAlarmActive || !activeTimer) return null

  const timer = activeTimer
  const zone = forecastTimezone ?? 'UTC'
  const dueLabel =
    liveNextReapplyAt != null
      ? `Due at ${formatTimeInZone(liveNextReapplyAt, zone)}${forecastTimezoneAbbreviation ? ` ${forecastTimezoneAbbreviation}` : ''}`
      : null

  function handleReapplied() {
    if (!location) return
    applySunscreen({
      uv: currentUv,
      activityMode: timer.activityMode,
      skinType: preferences.skinType,
      spf: preferences.spf,
      locationLabel: location.label,
    })
  }

  return (
    <div className="reapply-alarm" role="alertdialog" aria-labelledby="reapply-alarm-title">
      <div className="reapply-alarm__panel">
        <p className="reapply-alarm__eyebrow">Sunscreen reminder</p>
        <h1 id="reapply-alarm-title" className="reapply-alarm__title">
          Time to reapply
        </h1>
        <p className="reapply-alarm__body">
          Your protection window ended. Reapply sunscreen to stay protected.
        </p>
        {dueLabel && <p className="reapply-alarm__due">{dueLabel}</p>}

        <SwipeToSnoozeSlider onSnooze={snoozeReapplyAlarm} />

        <Button fullWidth onClick={handleReapplied} disabled={!location}>
          I just reapplied
        </Button>
        {!location && (
          <p className="reapply-alarm__note">Set your location on Home to log a new application.</p>
        )}
        <p className="reapply-alarm__note">
          Snoozing gives you {REAPPLY_SNOOZE_MINUTES} more minutes — the alarm will return if you
          have not reapplied.
        </p>
      </div>
    </div>
  )
}
