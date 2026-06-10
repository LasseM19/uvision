import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LocationBar } from '../components/LocationBar'
import { WeatherIconDisplay } from '../components/WeatherIcon'
import { useAppContext } from '../context/AppContext'
import { useForecast } from '../hooks/useForecast'
import { timerPhaseLabel } from '../lib/sunscreenTimer'
import { formatDate, formatDuration, formatTime, uvRiskColor, uvRiskLabel } from '../lib/uvLogic'

const recommendationStyles = {
  'take-sunscreen': { badge: 'Take sunscreen today', className: 'rec--take' },
  'fine-without': { badge: "You're fine without it", className: 'rec--fine' },
  'maybe-later': { badge: 'Maybe — check later', className: 'rec--maybe' },
} as const

export function HomePage() {
  const { location, preferences, activeTimer, phase, minutesLeft } = useAppContext()
  const { forecast, loading, error, refresh } = useForecast(location)

  const today = forecast?.daily[0]
  const currentHour = forecast?.hourlyToday.find((h) => {
    const now = Date.now()
    return h.time.getTime() <= now && h.time.getTime() > now - 3600_000
  }) ?? forecast?.hourlyToday[0]

  const rec = forecast ? recommendationStyles[forecast.recommendation] : null

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">UVision</p>
          <h1 className="page-title">Today</h1>
        </div>
      </header>

      <LocationBar />

      {loading && <p className="status-text">Loading forecast…</p>}
      {error && (
        <Card className="error-card">
          <p>{error}</p>
          <Button variant="secondary" onClick={refresh}>
            Try again
          </Button>
        </Card>
      )}

      {forecast && today && rec && (
        <>
          <Card className={`recommendation-card ${rec.className}`}>
            <p className="recommendation-badge">{rec.badge}</p>
            <p className="recommendation-text">{forecast.recommendationText}</p>
          </Card>

          <Card className="uv-hero-card">
            <div className="uv-hero-top">
              <WeatherIconDisplay icon={currentHour?.weatherIcon ?? today.weatherIcon} size="lg" />
              <div>
                <p className="uv-hero-label">Effective UV now</p>
                <p className="uv-hero-value" style={{ color: uvRiskColor(currentHour?.effectiveUv ?? 0) }}>
                  {currentHour?.effectiveUv ?? '—'}
                </p>
                {currentHour && currentHour.effectiveUv !== currentHour.uvIndex && (
                  <p className="uv-hero-sub">
                    Raw UV {currentHour.uvIndex} · {currentHour.cloudCover}% clouds
                  </p>
                )}
              </div>
            </div>
            <div className="uv-hero-meta">
              <span style={{ color: uvRiskColor(today.maxEffectiveUv) }}>
                {uvRiskLabel(today.maxEffectiveUv)} risk
              </span>
              {today.peakHour && <span>Peak ~{formatTime(today.peakHour)}</span>}
            </div>
          </Card>

          {activeTimer && (
            <Card className="timer-card">
              <p className="timer-phase">{timerPhaseLabel(phase)}</p>
              <p className="timer-countdown">
                {phase === 'reapply-now' || phase === 'overdue'
                  ? 'Time to reapply!'
                  : `${formatDuration(minutesLeft)} until reapply`}
              </p>
              <Link to="/timer" className="text-link">
                Open timer →
              </Link>
            </Card>
          )}

          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Today hourly</h2>
            </div>
            <div className="hourly-scroll">
              {forecast.hourlyToday.map((hour) => (
                <div key={hour.time.toISOString()} className="hourly-item">
                  <span className="hourly-time">{formatTime(hour.time)}</span>
                  <WeatherIconDisplay icon={hour.weatherIcon} size="sm" />
                  <span className="hourly-uv" style={{ color: uvRiskColor(hour.effectiveUv) }}>
                    {hour.effectiveUv}
                  </span>
                  <span className="hourly-cloud">{hour.cloudCover}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Next 4 days</h2>
            <div className="daily-list">
              {forecast.daily.map((day, index) => (
                <Card key={day.date.toISOString()} className="daily-card">
                  <div className="daily-card-main">
                    <div>
                      <p className="daily-date">{index === 0 ? 'Today' : formatDate(day.date)}</p>
                      <p className="daily-sub">
                        Clouds ~{Math.round(day.avgCloudCover)}% · Rain {day.maxPrecipitationProbability}%
                      </p>
                    </div>
                    <WeatherIconDisplay icon={day.weatherIcon} />
                  </div>
                  <div className="daily-uv-row">
                    <div>
                      <p className="daily-uv-label">Max effective UV</p>
                      <p className="daily-uv-value">{day.maxEffectiveUv}</p>
                    </div>
                    <div className="daily-uv-raw">
                      <p className="daily-uv-label">Raw max</p>
                      <p className="daily-uv-value daily-uv-value--muted">{day.maxUv}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {!activeTimer && today.maxEffectiveUv >= 3 && (
            <Link to="/timer">
              <Button fullWidth>I just applied sunscreen</Button>
            </Link>
          )}
        </>
      )}

      {!preferences.onboardingComplete && (
        <Card className="banner-card">
          <p>Complete setup to personalize your reminders.</p>
          <Link to="/onboarding">
            <Button variant="secondary" fullWidth>
              Finish setup
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
