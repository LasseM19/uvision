import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { LocationSettingsPrompt } from './LocationSettingsPrompt'
import type { Location } from '../types'
import {
  geolocationErrorMessage,
  insecureContextMessage,
  isPermissionDeniedError,
  isSecureContextForGeolocation,
  resolveCurrentLocation,
} from '../lib/geolocation'
import { searchCities } from '../lib/openMeteo'

interface LocationPickerProps {
  onSelect: (location: Location) => void
  onClose?: () => void
}

export function LocationPicker({ onSelect, onClose }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationBlocked, setLocationBlocked] = useState(false)
  const awaitingRetryRef = useRef(false)
  const secureContext = isSecureContextForGeolocation()

  const useGps = useCallback(async () => {
    setGpsLoading(true)
    setError(null)
    try {
      const location = await resolveCurrentLocation()
      setLocationBlocked(false)
      awaitingRetryRef.current = false
      onSelect(location)
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setLocationBlocked(true)
        awaitingRetryRef.current = true
        setError('Location is blocked for this website. Follow the Safari steps below, then tap Try again.')
      } else {
        setError(geolocationErrorMessage(err))
      }
    } finally {
      setGpsLoading(false)
    }
  }, [onSelect])

  useEffect(() => {
    if (!secureContext) {
      setError(insecureContextMessage())
    }
  }, [secureContext])

  useEffect(() => {
    const retryAfterSettings = () => {
      if (document.visibilityState !== 'visible' || !awaitingRetryRef.current) return
      void useGps()
    }

    document.addEventListener('visibilitychange', retryAfterSettings)
    window.addEventListener('focus', retryAfterSettings)
    return () => {
      document.removeEventListener('visibilitychange', retryAfterSettings)
      window.removeEventListener('focus', retryAfterSettings)
    }
  }, [useGps])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const id = window.setTimeout(async () => {
      setLoading(true)
      try {
        const cities = await searchCities(query)
        setResults(cities)
        if (cities.length === 0) {
          setError('No cities found — try a different spelling.')
        } else if (!locationBlocked) {
          setError(null)
        }
      } catch {
        setError('Could not search cities. Check your internet connection.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(id)
  }, [query, locationBlocked])

  return (
    <Card className="location-picker">
      <div className="location-picker-header">
        <p className="section-title" style={{ margin: 0 }}>
          Your location
        </p>
        {onClose && (
          <button type="button" className="ghost-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>
      <p className="hint-text">We use your location for UV forecasts only — never shared.</p>

      <LocationSettingsPrompt
        visible={locationBlocked}
        onTryAgain={() => void useGps()}
        trying={gpsLoading}
      />

      {!secureContext && <p className="warning-text">{insecureContextMessage()}</p>}

      <Button fullWidth onClick={() => void useGps()} disabled={gpsLoading || !secureContext}>
        {gpsLoading ? 'Finding you…' : 'Use my current location'}
      </Button>
      <div className="divider">
        <span>or search a city</span>
      </div>
      <input
        type="search"
        className="text-input"
        placeholder="Amsterdam, Utrecht, Rotterdam…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {loading && <p className="hint-text">Searching…</p>}
      {error && <p className="error-text">{error}</p>}
      {results.length > 0 && (
        <ul className="city-results">
          {results.map((city) => (
            <li key={`${city.latitude}-${city.longitude}`}>
              <button type="button" className="city-result-btn" onClick={() => onSelect(city)}>
                {city.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
