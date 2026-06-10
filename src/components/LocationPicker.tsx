import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import type { Location } from '../types'
import {
  geolocationErrorMessage,
  insecureContextMessage,
  isSecureContextForGeolocation,
  queryGeolocationPermission,
  type GeolocationPermission,
} from '../lib/geolocation'
import { resolveCurrentLocation, searchCities } from '../lib/openMeteo'

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
  const [permission, setPermission] = useState<GeolocationPermission>('unknown')
  const secureContext = isSecureContextForGeolocation()

  useEffect(() => {
    void queryGeolocationPermission().then(setPermission)
  }, [])

  useEffect(() => {
    if (!secureContext) {
      setError(insecureContextMessage())
    }
  }, [secureContext])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const id = window.setTimeout(async () => {
      setLoading(true)
      setError(secureContext ? null : insecureContextMessage())
      try {
        const cities = await searchCities(query)
        setResults(cities)
        if (cities.length === 0) {
          setError('No cities found — try a different spelling.')
        }
      } catch {
        setError('Could not search cities. Check your internet connection.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(id)
  }, [query, secureContext])

  async function useGps() {
    setGpsLoading(true)
    setError(null)
    try {
      const location = await resolveCurrentLocation()
      onSelect(location)
    } catch (err) {
      setError(geolocationErrorMessage(err))
      setPermission(await queryGeolocationPermission())
    } finally {
      setGpsLoading(false)
    }
  }

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

      {permission === 'denied' && (
        <p className="warning-text">
          Location is blocked for this site. In Safari: Settings → Privacy → Location Services. In
          Chrome: click the lock icon in the address bar → Location → Allow.
        </p>
      )}

      {!secureContext && (
        <p className="warning-text">{insecureContextMessage()}</p>
      )}

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
