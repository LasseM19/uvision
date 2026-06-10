import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { LocationSettingsPrompt } from './LocationSettingsPrompt'
import type { Location } from '../types'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import {
  geolocationErrorMessageForLang,
  insecureContextMessageForLang,
} from '../i18n'
import {
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
  const { locationPermissionDenied, markLocationAccessGranted, markLocationAccessDenied } =
    useAppContext()
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationBlocked, setLocationBlocked] = useState(locationPermissionDenied)
  const gpsInFlightRef = useRef(false)
  const secureContext = isSecureContextForGeolocation()

  useEffect(() => {
    setLocationBlocked(locationPermissionDenied)
  }, [locationPermissionDenied])

  const useGps = useCallback(async () => {
    if (gpsInFlightRef.current) return
    gpsInFlightRef.current = true
    setGpsLoading(true)
    setLocationBlocked(false)
    setError(null)

    try {
      const resolved = await resolveCurrentLocation()
      markLocationAccessGranted()
      onSelect(resolved)
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setLocationBlocked(true)
        markLocationAccessDenied()
      } else {
        setError(geolocationErrorMessageForLang(lang, err))
      }
    } finally {
      gpsInFlightRef.current = false
      setGpsLoading(false)
    }
  }, [lang, markLocationAccessDenied, markLocationAccessGranted, onSelect])

  useEffect(() => {
    if (!secureContext) {
      setError(insecureContextMessageForLang(lang))
    }
  }, [lang, secureContext])

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
          setError(t('locationPicker.noCities'))
        } else if (!locationBlocked) {
          setError(null)
        }
      } catch {
        setError(t('locationPicker.searchFailed'))
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(id)
  }, [query, locationBlocked, t])

  return (
    <Card className="location-picker">
      <div className="location-picker-header">
        <p className="section-title" style={{ margin: 0 }}>
          {t('locationPicker.title')}
        </p>
        {onClose && (
          <button type="button" className="ghost-icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        )}
      </div>
      <p className="hint-text">{t('locationPicker.privacy')}</p>

      <LocationSettingsPrompt visible={locationBlocked} />

      {!secureContext && <p className="warning-text">{insecureContextMessageForLang(lang)}</p>}

      <Button fullWidth onClick={() => void useGps()} disabled={gpsLoading || !secureContext}>
        {gpsLoading ? t('locationPicker.findingYou') : t('locationPicker.useCurrent')}
      </Button>
      <div className="divider">
        <span>{t('common.orSearchCity')}</span>
      </div>
      <input
        type="search"
        className="text-input"
        placeholder={t('common.cityPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {loading && <p className="hint-text">{t('common.searching')}</p>}
      {error && !locationBlocked && <p className="error-text">{error}</p>}
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
