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
import { useI18n } from '../hooks/useI18n'
import { uvRiskColor } from '../lib/uvLogic'

const recommendationClasses = {
  'take-sunscreen': 'rec--take',
  'fine-without': 'rec--fine',
  'maybe-later': 'rec--maybe',
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
  const { forecast, loading, error, refresh } = useForecast(location, preferences.language)
  const { t, uvRiskLabel, recommendationBadge, formatTimeInZone, formatDateInZone } = useI18n()

  const today = forecast?.daily[0]
  const currentHour = forecast?.hourlyToday.find((h) => {
    const now = Date.now()
    return h.time.getTime() <= now && h.time.getTime() > now - 3600_000
  }) ?? forecast?.hourlyToday[0]

  return (
    <div className="page">
      <PageBrandHeader title={t('home.title')} />

      <LocationBar />

      {loading && <p className="status-text">{t('home.loadingForecast')}</p>}
      {error && (
        <Card className="error-card">
          <p>{error}</p>
          <Button variant="secondary" onClick={refresh}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      )}

      {forecast && today && (
        <>
          <Card className={`recommendation-card ${recommendationClasses[forecast.recommendation]}`}>
            <p className="recommendation-badge">{recommendationBadge(forecast.recommendation)}</p>
            <p className="recommendation-text">{forecast.recommendationText}</p>
          </Card>

          <Card className="uv-hero-card">
            <div className="uv-hero-top">
              <WeatherIconDisplay icon={currentHour?.weatherIcon ?? today.weatherIcon} size="lg" />
              <div>
                <p className="uv-hero-label">{t('home.effectiveUvNow')}</p>
                <p className="uv-hero-value" style={{ color: uvRiskColor(currentHour?.effectiveUv ?? 0) }}>
                  {currentHour?.effectiveUv ?? '—'}
                </p>
                {currentHour && currentHour.effectiveUv !== currentHour.uvIndex && (
                  <p className="uv-hero-sub">
                    {t('home.rawUvClouds', {
                      uv: currentHour.uvIndex,
                      clouds: currentHour.cloudCover,
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="uv-hero-meta">
              <span style={{ color: uvRiskColor(today.maxEffectiveUv) }}>
                {t('home.risk', { risk: uvRiskLabel(today.maxEffectiveUv) })}
              </span>
              {today.peakHour && (
                <span>{t('home.peak', { time: formatTimeInZone(today.peakHour, forecast.timezone) })}</span>
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
                {t('home.openTimer')}
              </Link>
            </Card>
          )}

          <section className="section">
            <div className="section-header">
              <h2 className="section-title">{t('home.todayHourly')}</h2>
              <span className="timezone-badge">{forecast.timezoneAbbreviation}</span>
            </div>
            <Card className="hourly-chart-card">
              <HourlyUvChart hours={forecast.hourlyToday} timeZone={forecast.timezone} />
            </Card>
          </section>

          <section className="section">
            <h2 className="section-title">{t('home.nextFourDays')}</h2>
            <div className="daily-list">
              {forecast.daily.map((day, index) => (
                <Card key={day.date.toISOString()} className="daily-card">
                  <div className="daily-card-main">
                    <div>
                      <p className="daily-date">
                        {index === 0 ? t('common.today') : formatDateInZone(day.date, forecast.timezone)}
                      </p>
                      <p className="daily-sub">
                        {t('home.cloudsRain', {
                          clouds: Math.round(day.avgCloudCover),
                          rain: day.maxPrecipitationProbability,
                        })}
                      </p>
                    </div>
                    <WeatherIconDisplay icon={day.weatherIcon} />
                  </div>
                  <div className="daily-uv-row">
                    <div>
                      <p className="daily-uv-label">{t('home.maxEffectiveUv')}</p>
                      <p className="daily-uv-value">{day.maxEffectiveUv}</p>
                    </div>
                    <div className="daily-uv-raw">
                      <p className="daily-uv-label">{t('home.rawMax')}</p>
                      <p className="daily-uv-value daily-uv-value--muted">{day.maxUv}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {!activeTimer && today.maxEffectiveUv >= 3 && (
            <Link to="/timer">
              <Button fullWidth>{t('home.appliedSunscreen')}</Button>
            </Link>
          )}
        </>
      )}

      {!preferences.onboardingComplete && (
        <Card className="banner-card">
          <p>{t('home.setupBanner')}</p>
          <Link to="/onboarding">
            <Button variant="secondary" fullWidth>
              {t('home.finishSetup')}
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
