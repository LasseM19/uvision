import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ActiveTimerStatus } from '../components/ActiveTimerStatus'
import { ApplicationLogCard } from '../components/ApplicationLogCard'
import { PageBrandHeader } from '../components/PageBrandHeader'
import { useAppContext } from '../context/AppContext'
import { getActivityLabel } from '../lib/storage'
import { calculateReapplyInterval } from '../lib/sunscreenTimer'
import { formatTime, uvRiskColor, uvRiskLabel } from '../lib/uvLogic'
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
      <PageBrandHeader eyebrow="Timer" title="Sunscreen" />

      {!location && (
        <Card className="banner-card">
          <p className="hint-text">Set your location on Home first so we can calculate UV for your timer.</p>
        </Card>
      )}

      <Card
        className={`tracker-status-card timer-uv-card${activeTimer ? ' timer-uv-card--running' : ''}`}
      >
        <div className="timer-uv-live">
          <div>
            <p className="timer-uv-live__label">Current effective UV</p>
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
              Applied {formatTime(new Date(activeTimer.appliedAt))} ·{' '}
              {getActivityLabel(activeTimer.activityMode)} · UV {activeTimer.uvAtApplication} at application
            </p>
            <p className="tracker-meta">
              {liveIntervalMinutes
                ? `Reapply every ${liveIntervalMinutes} min at current UV ${currentUv}`
                : `UV is low (${currentUv}) — extended protection window`}
            </p>
            <div className="tracker-actions">
              <Button fullWidth onClick={handleApply}>
                I reapplied
              </Button>
              <Button variant="ghost" fullWidth onClick={dismissTimer}>
                Clear timer
              </Button>
            </div>
          </ActiveTimerStatus>
        ) : (
          <>
            <p className="timer-phase">No active protection</p>
            <p className="tracker-empty">
              Log when you apply sunscreen to start your reapply timer.
            </p>
            <p className="tracker-meta">
              {previewInterval
                ? `At current UV ${currentUv}, reapply every ${previewInterval} min`
                : `UV is low (${currentUv}) — no reapply timer needed`}
            </p>
          </>
        )}
      </Card>

      {!activeTimer && (
        <>
          <section className="section">
            <h2 className="section-title">Activity mode</h2>
            <div className="pill-group">
              {activityModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`pill${activityMode === mode ? ' pill--active' : ''}`}
                  onClick={() => setActivityMode(mode)}
                >
                  {getActivityLabel(mode)}
                </button>
              ))}
            </div>
          </section>

          <Button fullWidth onClick={handleApply} disabled={!location || previewInterval === null}>
            I just applied sunscreen
          </Button>
          {previewInterval === null && (
            <p className="hint-text">UV is low right now — no reapply timer needed.</p>
          )}
        </>
      )}

      {logs.length > 0 && (
        <section className="section">
          <h2 className="section-title">Recent applications</h2>
          <p className="hint-text log-list-hint">Swipe left on an entry to delete.</p>
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
            [Dev] Preview reapply alarm
          </Button>
        </section>
      )}
    </div>
  )
}
