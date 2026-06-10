import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { LocationBar } from '../components/LocationBar'
import { useAppContext } from '../context/AppContext'
import { useForecast } from '../hooks/useForecast'
import { WeatherIconDisplay } from '../components/WeatherIcon'
import { formatDate } from '../lib/uvLogic'

export function ForecastPage() {
  const { location } = useAppContext()
  const { forecast, loading, error, refresh } = useForecast(location)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Forecast</p>
          <h1 className="page-title">Next 4 days</h1>
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

      {forecast && (
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
      )}
    </div>
  )
}
