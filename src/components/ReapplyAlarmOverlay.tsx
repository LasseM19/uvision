import { useEffect, useRef } from 'react'
import { Button } from './Button'
import { SwipeToSnoozeSlider } from './SwipeToSnoozeSlider'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
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
  const { t, formatTimeInZone } = useI18n()
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
      ? t('alarm.dueAt', {
          time: formatTimeInZone(liveNextReapplyAt, zone),
          tz: forecastTimezoneAbbreviation ? ` ${forecastTimezoneAbbreviation}` : '',
        })
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
        <p className="reapply-alarm__eyebrow">{t('alarm.eyebrow')}</p>
        <h1 id="reapply-alarm-title" className="reapply-alarm__title">
          {t('alarm.title')}
        </h1>
        <p className="reapply-alarm__body">{t('alarm.body')}</p>
        {dueLabel && <p className="reapply-alarm__due">{dueLabel}</p>}

        <SwipeToSnoozeSlider onSnooze={snoozeReapplyAlarm} />

        <Button fullWidth onClick={handleReapplied} disabled={!location}>
          {t('alarm.iJustReapplied')}
        </Button>
        {!location && <p className="reapply-alarm__note">{t('alarm.noLocation')}</p>}
        <p className="reapply-alarm__note">
          {t('alarm.snoozeNote', { minutes: REAPPLY_SNOOZE_MINUTES })}
        </p>
      </div>
    </div>
  )
}
