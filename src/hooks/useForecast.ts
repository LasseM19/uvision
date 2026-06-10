import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppLanguage, ForecastData, Location } from '../types'
import { recommendationTextFromForecast, translate } from '../i18n'
import { fetchForecast } from '../lib/openMeteo'

interface UseForecastResult {
  forecast: ForecastData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

function localizeForecast(forecast: ForecastData, lang: AppLanguage): ForecastData {
  const today = forecast.daily[0]
  const maxEffectiveUv = today?.maxEffectiveUv ?? 0
  const hourlyEffective = forecast.hourlyToday.map((hour) => hour.effectiveUv)

  return {
    ...forecast,
    recommendationText: recommendationTextFromForecast(lang, maxEffectiveUv, hourlyEffective),
  }
}

export function useForecast(location: Location | null, lang: AppLanguage): UseForecastResult {
  const [rawForecast, setRawForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const forecast = useMemo(
    () => (rawForecast ? localizeForecast(rawForecast, lang) : null),
    [rawForecast, lang],
  )

  const load = useCallback(async () => {
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchForecast(location)
      setRawForecast(data)
    } catch {
      setError(translate(lang, 'error.forecastFailed'))
    } finally {
      setLoading(false)
    }
  }, [location, lang])

  useEffect(() => {
    void load()
  }, [load])

  return { forecast, loading, error, refresh: load }
}
