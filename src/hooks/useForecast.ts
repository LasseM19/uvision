import { useCallback, useEffect, useState } from 'react'
import type { ForecastData, Location } from '../types'
import { fetchForecast } from '../lib/openMeteo'

interface UseForecastResult {
  forecast: ForecastData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useForecast(location: Location | null): UseForecastResult {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!location) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchForecast(location)
      setForecast(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => {
    void load()
  }, [load])

  return { forecast, loading, error, refresh: load }
}
