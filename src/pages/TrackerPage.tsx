import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useAppContext } from '../context/AppContext'
import { useForecast } from '../hooks/useForecast'
import { getActivityLabel } from '../lib/storage'
import {
  calculateReapplyInterval,
  timerPhaseLabel,
} from '../lib/sunscreenTimer'
import { formatDuration, formatTime, uvRiskColor } from '../lib/uvLogic'
import type { ActivityMode } from '../types'
import { LocationPicker } from '../components/LocationPicker'

const activityModes: ActivityMode[] = ['normal', 'swimming', 'sports']

export function TrackerPage() {
  const {
    location,
    setLocation,
    preferences,
    activeTimer,
    phase,
    minutesLeft,
    applySunscreen,
    dismissTimer,
    logs,
  } = useAppContext()
  const { forecast } = useForecast(location)
  const [activityMode, setActivityMode] = useState<ActivityMode>('normal')
  const [showLocation, setShowLocation] = useState(!location)

  const currentUv =
    forecast?.hourlyToday.find((h) => h.time.getTime() <= Date.now())?.effectiveUv ??
    forecast?.daily[0]?.maxEffectiveUv ??
    0

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
      activityMode,
      skinType: preferences.skinType,
      spf: preferences.spf,
      locationLabel: location.label,
    })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tracker</p>
          <h1 className="page-title">Sunscreen</h1>
        </div>
      </header>

      {showLocation || !location ? (
        <LocationPicker
          onSelect={(loc) => {
            setLocation(loc)
            setShowLocation(false)
          }}
          onClose={location ? () => setShowLocation(false) : undefined}
        />
      ) : (
        <button type="button" className="location-chip" onClick={() => setShowLocation(true)}>
          📍 {location.label}
        </button>
      )}

      <Card className="tracker-status-card">
        <p className="timer-phase">{timerPhaseLabel(phase)}</p>
        {activeTimer ? (
          <>
            <p className="timer-countdown timer-countdown--large">
              {phase === 'reapply-now' || phase === 'overdue'
                ? 'Reapply now!'
                : formatDuration(minutesLeft)}
            </p>
            <p className="tracker-meta">
              Applied {formatTime(new Date(activeTimer.appliedAt))} ·{' '}
              {getActivityLabel(activeTimer.activityMode)} · every{' '}
              {activeTimer.intervalMinutes} min
            </p>
            <p className="tracker-meta">
              Next reapply ~{formatTime(new Date(activeTimer.nextReapplyAt))}
            </p>
            <div className="tracker-actions">
              <Button fullWidth onClick={handleApply}>
                I reapplied
              </Button>
              <Button variant="ghost" fullWidth onClick={dismissTimer}>
                Clear timer
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="tracker-empty">
              Log when you apply sunscreen to start your reapply timer.
            </p>
            <p className="tracker-meta">
              Current UV:{' '}
              <strong style={{ color: uvRiskColor(currentUv) }}>{currentUv}</strong>
              {previewInterval
                ? ` · Reapply every ${previewInterval} min`
                : ' · No reapply needed (UV low)'}
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
          <div className="log-list">
            {logs.slice(0, 7).map((log) => (
              <Card key={log.id} className="log-item">
                <div>
                  <p className="log-date">
                    {new Date(log.appliedAt).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {formatTime(new Date(log.appliedAt))}
                  </p>
                  <p className="log-meta">
                    UV {log.uvAtApplication} · {getActivityLabel(log.activityMode)} · every{' '}
                    {log.intervalMinutes} min
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
