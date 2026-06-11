import { useEffect, useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { LocationSettingsPrompt } from './LocationSettingsPrompt'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import { geolocationErrorMessageForLang } from '../i18n'
import { reverseGeocodeHomeAddress, searchAddresses } from '../lib/addressSearch'
import {
  ensureGeolocationAccess,
  isPermissionDeniedError,
  isSecureContextForGeolocation,
} from '../lib/geolocation'
import type { HomeGeofenceRadius } from '../types'

interface HomeAddressSettingsProps {
  onHomeSaved?: () => void
}

export function HomeAddressSettings({ onHomeSaved }: HomeAddressSettingsProps) {
  const {
    location,
    homeLocation,
    preferences,
    setHomeLocation,
    clearHomeLocation,
    setPreferences,
    markLocationAccessGranted,
    markLocationAccessDenied,
    locationPermissionDenied,
  } = useAppContext()
  const { t, lang } = useI18n()

  const [query, setQuery] = useState(homeLocation?.label ?? '')
  const [results, setResults] = useState<
    Array<{ latitude: number; longitude: number; label: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(locationPermissionDenied)
  const secureContext = isSecureContextForGeolocation()

  useEffect(() => {
    setShowHelp(locationPermissionDenied)
  }, [locationPermissionDenied])

  useEffect(() => {
    if (homeLocation) {
      setQuery(homeLocation.label)
    }
  }, [homeLocation])

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      return
    }

    const id = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const matches = await searchAddresses(
          query,
          location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
        )
        setResults(matches)
        if (matches.length === 0) {
          setError(t('homeAddress.noResults'))
        }
      } catch {
        setError(t('homeAddress.searchFailed'))
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(id)
  }, [query, location, t])

  async function saveHome(latitude: number, longitude: number, label: string) {
    setSaving(true)
    setError(null)
    try {
      setHomeLocation({
        latitude,
        longitude,
        label,
        radiusMeters: preferences.homeGeofenceRadiusMeters,
        setAt: new Date().toISOString(),
      })
      setQuery(label)
      setResults([])
      onHomeSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('homeAddress.couldNotSave'))
    } finally {
      setSaving(false)
    }
  }

  async function useCurrentLocation() {
    setSaving(true)
    setError(null)
    setShowHelp(false)
    try {
      const position = await ensureGeolocationAccess()
      markLocationAccessGranted()
      const label = await reverseGeocodeHomeAddress(
        position.coords.latitude,
        position.coords.longitude,
        lang,
      )
      await saveHome(position.coords.latitude, position.coords.longitude, label)
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        setShowHelp(true)
        markLocationAccessDenied()
      } else {
        setError(geolocationErrorMessageForLang(lang, err))
      }
    } finally {
      setSaving(false)
    }
  }

  const radiusOptions: HomeGeofenceRadius[] = [50, 75, 100, 150, 200, 300, 500]

  return (
    <Card>
      <p className="hint-text">{t('homeAddress.hint')}</p>

      {homeLocation && (
        <p className="location-settings-current">
          {t('homeAddress.homeRadius', {
            label: homeLocation.label,
            radius: homeLocation.radiusMeters,
          })}
        </p>
      )}

      <LocationSettingsPrompt visible={showHelp} />

      <label className="field-label" htmlFor="home-address">
        {t('homeAddress.addressLabel')}
      </label>
      <p className="hint-text">{t('homeAddress.addressExample')}</p>
      <input
        id="home-address"
        type="search"
        className="text-input"
        placeholder={t('common.homePlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="street-address"
      />
      {loading && <p className="hint-text">{t('common.searching')}</p>}
      {results.length > 0 && (
        <ul className="city-results">
          {results.map((address) => (
            <li key={`${address.latitude}-${address.longitude}-${address.label}`}>
              <button
                type="button"
                className="city-result-btn"
                disabled={saving}
                onClick={() => void saveHome(address.latitude, address.longitude, address.label)}
              >
                {address.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {secureContext && (
        <Button
          variant="secondary"
          fullWidth
          style={{ marginTop: '0.75rem' }}
          disabled={saving}
          onClick={() => void useCurrentLocation()}
        >
          {saving ? t('common.saving') : t('homeAddress.useCurrentAsHome')}
        </Button>
      )}

      <section className="section" style={{ marginTop: '1rem', marginBottom: 0 }}>
        <h3 className="section-title">{t('homeAddress.alertRadius')}</h3>
        <div className="pill-group">
          {radiusOptions.map((radius) => (
            <button
              key={radius}
              type="button"
              className={`pill${preferences.homeGeofenceRadiusMeters === radius ? ' pill--active' : ''}`}
              onClick={() => {
                setPreferences({ homeGeofenceRadiusMeters: radius })
                if (homeLocation) {
                  setHomeLocation({ ...homeLocation, radiusMeters: radius })
                }
              }}
            >
              {radius} m
            </button>
          ))}
        </div>
        <p className="hint-text">{t('homeAddress.radiusHint')}</p>
      </section>

      {homeLocation && (
        <Button variant="ghost" fullWidth style={{ marginTop: '0.75rem' }} onClick={clearHomeLocation}>
          {t('homeAddress.removeHome')}
        </Button>
      )}

      {error && <p className="error-text">{error}</p>}
    </Card>
  )
}
