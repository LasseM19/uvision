import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { AccountSubpageHeader } from '../components/AccountSubpageHeader'
import { Logo } from '../components/Logo'
import { useAppContext } from '../context/AppContext'
import { getSkinTypeLabel, getSpfLabel } from '../lib/storage'

export function HistoryPage() {
  const { logs } = useAppContext()

  const stats = useMemo(() => {
    const now = Date.now()
    const fourteenDaysAgo = now - 14 * 86400_000
    const recent = logs.filter((l) => new Date(l.appliedAt).getTime() >= fourteenDaysAgo)
    const daysWithApplication = new Set(
      recent.map((l) => new Date(l.appliedAt).toDateString()),
    ).size
    return { daysWithApplication, total: recent.length }
  }, [logs])

  return (
    <div className="page">
      <AccountSubpageHeader title="Your protection" />

      <Card className="stats-card">
        <p className="stats-value">{stats.daysWithApplication}</p>
        <p className="stats-label">days protected in the last 14 days</p>
        <p className="stats-sub">{stats.total} applications logged</p>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <p>No applications logged yet. Head to the timer when you apply sunscreen.</p>
          <Link to="/timer">
            <Button variant="secondary" fullWidth>
              Go to timer
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="log-list">
          {logs.map((log) => (
            <Card key={log.id} className="log-item">
              <p className="log-date">
                {new Date(log.appliedAt).toLocaleString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className="log-meta">
                {log.locationLabel} · UV {log.uvAtApplication} · every {log.intervalMinutes} min
              </p>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}

export function OnboardingPage() {
  const { preferences, setPreferences } = useAppContext()

  function finish() {
    setPreferences({ onboardingComplete: true })
  }

  if (preferences.onboardingComplete) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="page onboarding-page">
      <div className="onboarding-brand">
        <Logo size="lg" />
      </div>
      <header className="page-header onboarding-header">
        <div>
          <p className="eyebrow">Welcome</p>
          <h1 className="page-title">Let&apos;s personalize UVision</h1>
        </div>
      </header>

      <p className="intro-text">
        A few quick choices help us calculate when you should reapply sunscreen.
      </p>

      <section className="section">
        <h2 className="section-title">Your skin type</h2>
        <div className="option-list">
          {([1, 2, 3, 4, 5, 6] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`option-row${preferences.skinType === type ? ' option-row--active' : ''}`}
              onClick={() => setPreferences({ skinType: type })}
            >
              <span>Type {type}</span>
              <span className="option-sub">{getSkinTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Your usual SPF</h2>
        <div className="pill-group">
          {([15, 30, 50] as const).map((spf) => (
            <button
              key={spf}
              type="button"
              className={`pill${preferences.spf === spf ? ' pill--active' : ''}`}
              onClick={() => setPreferences({ spf })}
            >
              {getSpfLabel(spf)}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Morning reminder</h2>
        <Card>
          <label className="field-label" htmlFor="onboard-time">
            What time should we remind you on high-UV days?
          </label>
          <input
            id="onboard-time"
            type="time"
            className="time-input"
            value={preferences.morningCheckTime}
            onChange={(e) => setPreferences({ morningCheckTime: e.target.value })}
          />
        </Card>
      </section>

      <Button fullWidth onClick={finish}>
        Get started
      </Button>
    </div>
  )
}
