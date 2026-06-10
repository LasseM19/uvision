import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ActiveTimerStatus } from '../components/ActiveTimerStatus'
import { LocationBar } from '../components/LocationBar'
import { PageBrandHeader } from '../components/PageBrandHeader'
import { HourlyUvChart } from '../components/HourlyUvChart'
import { WeatherIconDisplay } from '../components/WeatherIcon'
import { useAppContext } from '../context/AppContext'
import { useForecast } from '../hooks/useForecast'
import { formatDateInZone, formatTimeInZone } from '../lib/timezone'
import { uvRiskColor, uvRiskLabel } from '../lib/uvLogic'

const recommendationStyles = {
  'take-sunscreen': { badge: 'Take sunscreen today', className: 'rec--take' },
  'fine-without': { badge: "You're fine without it", className: 'rec--fine' },
  'maybe-later': { badge: 'Maybe — check later', className: 'rec--maybe' },
} as const

export function HomePage() {
  const {
    location,
    preferences,
    activeTimer,
    phase,
    minutesLeft,
    liveNextReapplyAt,
    forecastTimezone,
    forecastTimezoneAbbreviation,
  } = useAppContext()
  const { forecast, loading, error, refresh } = useForecast(location)

  const today = forecast?.daily[0]
  const currentHour = forecast?.hourlyToday.find((h) => {
    const now = Date.now()
    return h.time.getTime() <= now && h.time.getTime() > now - 3600_000
  }) ?? forecast?.hourlyToday[0]

  const rec = forecast ? recommendationStyles[forecast.recommendation] : null

  return (
    <div className="page">
      <PageBrandHeader title="Today" />

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
              {today.peakHour && (
                <span>Peak ~{formatTimeInZone(today.peakHour, forecast.timezone)}</span>
              )}
            </div>
          </Card>

          {activeTimer && liveNextReapplyAt && (
            <Card className="timer-card timer-card--active">
              <ActiveTimerStatus
                compact
                phase={phase}
                minutesLeft={minutesLeft}
                nextReapplyAt={liveNextReapplyAt}
                timeZone={forecastTimezone}
                timezoneAbbreviation={forecastTimezoneAbbreviation}
              />
              <Link to="/timer" className="text-link">
                Open timer →
              </Link>
            </Card>
          )}

          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Today hourly</h2>
              <span className="timezone-badge">{forecast.timezoneAbbreviation}</span>
            </div>
            <Card className="hourly-chart-card">
              <HourlyUvChart hours={forecast.hourlyToday} timeZone={forecast.timezone} />
            </Card>
          </section>

          <section className="section">
            <h2 className="section-title">Next 4 days</h2>
            <div className="daily-list">
              {forecast.daily.map((day, index) => (
                <Card key={day.date.toISOString()} className="daily-card">
                  <div className="daily-card-main">
                    <div>
                      <p className="daily-date">
                        {index === 0 ? 'Today' : formatDateInZone(day.date, forecast.timezone)}
                      </p>
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
