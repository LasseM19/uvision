import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ActiveTimerStatus } from '../components/ActiveTimerStatus'
import { ApplicationLogCard } from '../components/ApplicationLogCard'
import { PageBrandHeader } from '../components/PageBrandHeader'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import { calculateReapplyInterval } from '../lib/sunscreenTimer'
import { uvRiskColor } from '../lib/uvLogic'
import type { ActivityMode } from '../types'

const activityModes: ActivityMode[] = ['normal', 'swimming', 'sports']

export function TimerPage() {
  const {
    location,
    preferences,
    activeTimer,
    phase,
    minutesLeft,
    currentUv,
    liveIntervalMinutes,
    liveNextReapplyAt,
    forecastTimezone,
    forecastTimezoneAbbreviation,
    applySunscreen,
    dismissTimer,
    deleteApplicationLog,
    devTriggerReapplyAlarm,
    logs,
  } = useAppContext()
  const { t, uvRiskLabel, activityLabel, formatTime } = useI18n()
  const [activityMode, setActivityMode] = useState<ActivityMode>('normal')

  const previewInterval = calculateReapplyInterval(
    currentUv,
    preferences.skinType,
    preferences.spf,
    activityMode,
  )

  function handleApply() {
    if (!location) return
    applySunscreen({
      uv: currentUv,
      activityMode: activeTimer?.activityMode ?? activityMode,
      skinType: preferences.skinType,
      spf: preferences.spf,
      locationLabel: location.label,
    })
  }

  return (
    <div className="page">
      <PageBrandHeader eyebrow={t('timer.eyebrow')} title={t('timer.title')} />

      {!location && (
        <Card className="banner-card">
          <p className="hint-text">{t('timer.noLocation')}</p>
        </Card>
      )}

      <Card
        className={`tracker-status-card timer-uv-card${activeTimer ? ' timer-uv-card--running' : ''}`}
      >
        <div className="timer-uv-live">
          <div>
            <p className="timer-uv-live__label">{t('timer.currentEffectiveUv')}</p>
            <p className="timer-uv-live__value" style={{ color: uvRiskColor(currentUv) }}>
              {currentUv}
            </p>
          </div>
          <p className="timer-uv-live__risk">{uvRiskLabel(currentUv)}</p>
        </div>

        {activeTimer && liveNextReapplyAt ? (
          <ActiveTimerStatus
            phase={phase}
            minutesLeft={minutesLeft}
            nextReapplyAt={liveNextReapplyAt}
            timeZone={forecastTimezone}
            timezoneAbbreviation={forecastTimezoneAbbreviation}
          >
            <p className="tracker-meta">
              {t('timer.appliedAt', {
                time: formatTime(new Date(activeTimer.appliedAt)),
                activity: activityLabel(activeTimer.activityMode),
                uv: activeTimer.uvAtApplication,
              })}
            </p>
            <p className="tracker-meta">
              {liveIntervalMinutes
                ? t('timer.reapplyEvery', {
                    minutes: liveIntervalMinutes,
                    uv: currentUv,
                  })
                : t('timer.lowUvExtended', { uv: currentUv })}
            </p>
            <div className="tracker-actions">
              <Button fullWidth onClick={handleApply}>
                {t('timer.iReapplied')}
              </Button>
              <Button variant="ghost" fullWidth onClick={dismissTimer}>
                {t('timer.clearTimer')}
              </Button>
            </div>
          </ActiveTimerStatus>
        ) : (
          <>
            <p className="timer-phase">{t('timer.noActiveProtection')}</p>
            <p className="tracker-empty">{t('timer.logToStart')}</p>
            <p className="tracker-meta">
              {previewInterval
                ? t('timer.previewInterval', { uv: currentUv, minutes: previewInterval })
                : t('timer.lowUvNoTimer', { uv: currentUv })}
            </p>
          </>
        )}
      </Card>

      {!activeTimer && (
        <>
          <section className="section">
            <h2 className="section-title">{t('timer.activityMode')}</h2>
            <div className="pill-group">
              {activityModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`pill${activityMode === mode ? ' pill--active' : ''}`}
                  onClick={() => setActivityMode(mode)}
                >
                  {activityLabel(mode)}
                </button>
              ))}
            </div>
          </section>

          <Button fullWidth onClick={handleApply} disabled={!location || previewInterval === null}>
            {t('timer.iJustApplied')}
          </Button>
          {previewInterval === null && <p className="hint-text">{t('timer.lowUvHint')}</p>}
        </>
      )}

      {logs.length > 0 && (
        <section className="section">
          <h2 className="section-title">{t('timer.recentApplications')}</h2>
          <p className="hint-text log-list-hint">{t('timer.swipeToDelete')}</p>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => (
              <ApplicationLogCard
                key={log.id}
                log={log}
                variant="compact"
                onDelete={deleteApplicationLog}
              />
            ))}
          </div>
        </section>
      )}

      {import.meta.env.DEV && devTriggerReapplyAlarm && (
        <section className="section">
          <Button variant="ghost" fullWidth onClick={devTriggerReapplyAlarm}>
            {t('timer.devPreviewAlarm')}
          </Button>
        </section>
      )}
    </div>
  )
}
