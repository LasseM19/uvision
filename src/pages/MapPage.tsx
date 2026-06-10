import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LocationMap } from '../components/LocationMap'
import { LocationSettingsPrompt } from '../components/LocationSettingsPrompt'
import { useAppContext } from '../context/AppContext'
import {
  ensureGeolocationAccess,
  geolocationErrorMessage,
  isPermissionDeniedError,
  isSecureContextForGeolocation,
  resolveCurrentLocation,
  reverseGeocodeLabel,
} from '../lib/geolocation'
import type { HomeGeofenceRadius } from '../types'

export function MapPage() {
  const {
    location,
    homeLocation,
    livePosition,
    liveTrackingEnabled,
    locationPermissionDenied,
    preferences,
    setHomeLocation,
    clearHomeLocation,
    setPreferences,
    setLocation,
    markLocationAccessGranted,
    markLocationAccessDenied,
  } = useAppContext()
  const [savingHome, setSavingHome] = useState(false)
  const [homeError, setHomeError] = useState<string | null>(null)
  const [enablingLocation, setEnablingLocation] = useState(false)

  const secureContext = isSecureContextForGeolocation()
  const showLocationHelp = locationPermissionDenied

  const setHomeFromPosition = useCallback(
    async (latitude: number, longitude: number) => {
      setSavingHome(true)
      setHomeError(null)
      try {
        const label = await reverseGeocodeLabel(latitude, longitude)
        setHomeLocation({
          latitude,
          longitude,
          label: label.split(',')[0] || 'Home',
          radiusMeters: preferences.homeGeofenceRadiusMeters,
          setAt: new Date().toISOString(),
        })
      } catch (err) {
        setHomeError(err instanceof Error ? err.message : 'Could not save home location.')
      } finally {
        setSavingHome(false)
      }
    },
    [preferences.homeGeofenceRadiusMeters, setHomeLocation],
  )

  async function enableLiveLocation() {
    setEnablingLocation(true)
    setHomeError(null)
    try {
      await ensureGeolocationAccess()
      markLocationAccessGranted()
      if (!location) {
        const resolved = await resolveCurrentLocation()
        setLocation(resolved)
      }
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        markLocationAccessDenied()
      } else {
        setHomeError(geolocationErrorMessage(err))
      }
    } finally {
      setEnablingLocation(false)
    }
  }

  async function handleSetHomeHere() {
    if (livePosition) {
      await setHomeFromPosition(livePosition.latitude, livePosition.longitude)
      return
    }

    setSavingHome(true)
    setHomeError(null)
    try {
      const resolved = await resolveCurrentLocation()
      markLocationAccessGranted()
      await setHomeFromPosition(resolved.latitude, resolved.longitude)
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        markLocationAccessDenied()
      } else {
        setHomeError(geolocationErrorMessage(err))
      }
    } finally {
      setSavingHome(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Map</p>
          <h1 className="page-title">You &amp; home</h1>
        </div>
      </header>

      {!secureContext && (
        <Card className="error-card">
          <p className="error-text">Location requires https. Open UVision via your secure app link.</p>
        </Card>
      )}

      <LocationSettingsPrompt visible={showLocationHelp} />

      {!liveTrackingEnabled && secureContext && !showLocationHelp && (
        <Card className="banner-card">
          <p className="hint-text">
            Safari only allows GPS after you tap a button. Enable live location to see yourself on
            the map.
          </p>
          <Button fullWidth onClick={() => void enableLiveLocation()} disabled={enablingLocation}>
            {enablingLocation ? 'Requesting location…' : 'Enable live location'}
          </Button>
        </Card>
      )}

      <Card className="map-card">
        <LocationMap
          home={homeLocation}
          livePosition={livePosition}
          fallbackLocation={location}
          height={320}
        />
        {liveTrackingEnabled && livePosition === null && secureContext && (
          <p className="hint-text">Finding your position…</p>
        )}
        {homeError && !showLocationHelp && <p className="error-text">{homeError}</p>}
      </Card>

      <section className="section">
        <h2 className="section-title">Home area</h2>
        <Card>
          {homeLocation ? (
            <>
              <p className="location-settings-current">{homeLocation.label}</p>
              <p className="hint-text">
                Orange circle = home zone ({homeLocation.radiusMeters} m). GPS indoors can be
                approximate.
              </p>
              <div className="map-actions">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => void handleSetHomeHere()}
                  disabled={savingHome || !secureContext}
                >
                  Update home to here
                </Button>
                <Button variant="ghost" fullWidth onClick={clearHomeLocation}>
                  Remove home
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="hint-text">
                Set your home while you are there. UVision uses it to detect when you leave and
                remind you about sunscreen on high-UV days.
              </p>
              <Button fullWidth onClick={() => void handleSetHomeHere()} disabled={savingHome || !secureContext}>
                {savingHome ? 'Saving…' : 'I am home — set here'}
              </Button>
            </>
          )}
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">Home zone size</h2>
        <div className="pill-group">
          {([100, 150, 200, 300] as const satisfies HomeGeofenceRadius[]).map((radius) => (
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
        <p className="hint-text">Larger zones reduce false alerts when GPS jumps near home.</p>
      </section>

      <section className="section">
        <h2 className="section-title">Leave-home alerts</h2>
        <Card>
          <p className="hint-text">
            When enabled, UVision watches your position while the app is open. If you leave home on
            a high-UV day, you get an in-app alert and optional push notification (English).
          </p>
          <Button
            variant={preferences.leaveHomeAlertsEnabled ? 'secondary' : 'primary'}
            fullWidth
            style={{ marginTop: '0.75rem' }}
            onClick={() =>
              setPreferences({ leaveHomeAlertsEnabled: !preferences.leaveHomeAlertsEnabled })
            }
          >
            {preferences.leaveHomeAlertsEnabled ? 'Leave-home alerts on' : 'Enable leave-home alerts'}
          </Button>
          <Link to="/settings" className="text-link map-settings-link">
            Notification settings →
          </Link>
        </Card>
      </section>
    </div>
  )
}
