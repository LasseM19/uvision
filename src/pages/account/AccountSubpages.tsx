import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { AccountSubpageHeader } from '../../components/AccountSubpageHeader'
import { HomeAddressSettings } from '../../components/HomeAddressSettings'
import { LocationPicker } from '../../components/LocationPicker'
import { useAppContext } from '../../context/AppContext'
import { useForecast } from '../../hooks/useForecast'
import { clearAppCacheAndReload } from '../../lib/clearCache'
import { isBackendConfigured } from '../../lib/api'
import { requestNotificationPermission } from '../../lib/notifications'
import { sendTestPush, subscribeToBackendPush } from '../../lib/pushBackend'
import { getSkinTypeLabel, getSpfLabel } from '../../lib/storage'
import type { AppLanguage } from '../../types'

export function AccountProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAppContext()

  async function handleLogout() {
    await logout()
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="page">
      <AccountSubpageHeader title="Profile" />

      <Card>
        <p className="location-settings-current">Guest</p>
        <p className="hint-text">
          You are using UVision without an account. Your data stays on this device.
        </p>
        <Button variant="secondary" fullWidth disabled style={{ marginTop: '0.75rem' }}>
          Sign in — coming soon
        </Button>
      </Card>

      <Button
        variant="ghost"
        fullWidth
        className="account-logout-btn"
        style={{ marginTop: '1rem' }}
        onClick={() => void handleLogout()}
      >
        Log out
      </Button>
    </div>
  )
}

export function AccountLocationPage() {
  const { location, setLocation } = useAppContext()
  const [showLocationPicker, setShowLocationPicker] = useState(!location)

  return (
    <div className="page">
      <AccountSubpageHeader title="Forecast location" />

      <p className="hint-text">
        Used for UV forecasts on Home. Set once — change here when you travel.
      </p>

      {showLocationPicker ? (
        <LocationPicker
          onSelect={(loc) => {
            setLocation(loc)
            setShowLocationPicker(false)
          }}
          onClose={location ? () => setShowLocationPicker(false) : undefined}
        />
      ) : (
        <Card className="location-settings-card">
          <p className="location-settings-current">{location?.label}</p>
          <Button variant="secondary" fullWidth onClick={() => setShowLocationPicker(true)}>
            Change location
          </Button>
        </Card>
      )}
    </div>
  )
}

export function AccountSkinPage() {
  const { preferences, setPreferences } = useAppContext()

  return (
    <div className="page">
      <AccountSubpageHeader title="Skin & SPF" />

      <section className="section">
        <h2 className="section-title">Skin type</h2>
        <div className="option-list">
          {([1, 2, 3, 4, 5, 6] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`option-row${preferences.skinType === type ? ' option-row--active' : ''}`}
              onClick={() => setPreferences({ skinType: type })}
            >
              <span>Type {type}</span>
              <span className="option-sub">{getSkinTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">SPF</h2>
        <div className="pill-group">
          {([15, 30, 50] as const).map((spf) => (
            <button
              key={spf}
              type="button"
              className={`pill${preferences.spf === spf ? ' pill--active' : ''}`}
              onClick={() => setPreferences({ spf })}
            >
              {getSpfLabel(spf)}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export function AccountLanguagePage() {
  const { preferences, setPreferences } = useAppContext()

  return (
    <div className="page">
      <AccountSubpageHeader title="Language" />

      <div className="pill-group">
        {(
          [
            { value: 'en' as AppLanguage, label: 'English' },
            { value: 'nl' as AppLanguage, label: 'Nederlands' },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`pill${preferences.language === value ? ' pill--active' : ''}`}
            onClick={() => setPreferences({ language: value })}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="hint-text">Full Dutch translation coming soon — preference is saved now.</p>
    </div>
  )
}

export function AccountHomePage() {
  const {
    preferences,
    setPreferences,
    homeLocation,
    setLiveTrackingEnabled,
    markLocationAccessGranted,
  } = useAppContext()

  function toggleLeaveHomeAlerts() {
    const next = !preferences.leaveHomeAlertsEnabled
    setPreferences({ leaveHomeAlertsEnabled: next })
    if (next && homeLocation) {
      markLocationAccessGranted()
      setLiveTrackingEnabled(true)
    }
    if (!next) {
      setLiveTrackingEnabled(false)
    }
  }

  return (
    <div className="page">
      <AccountSubpageHeader title="Home & alerts" />

      <HomeAddressSettings
        onHomeSaved={() => {
          if (preferences.leaveHomeAlertsEnabled) {
            markLocationAccessGranted()
            setLiveTrackingEnabled(true)
          }
        }}
      />

      <div style={{ marginTop: '0.75rem' }}>
        <Card>
          <p className="hint-text">
            Get an English alert when you leave home on high-UV days (while the app is open).
          </p>
          <Button
            variant={preferences.leaveHomeAlertsEnabled ? 'secondary' : 'primary'}
            fullWidth
            style={{ marginTop: '0.75rem' }}
            onClick={toggleLeaveHomeAlerts}
            disabled={!homeLocation && !preferences.leaveHomeAlertsEnabled}
          >
            {preferences.leaveHomeAlertsEnabled ? 'Leave-home alerts on' : 'Enable leave-home alerts'}
          </Button>
          {!homeLocation && <p className="hint-text">Set a home address above first.</p>}
        </Card>
      </div>
    </div>
  )
}

export function AccountNotificationsPage() {
  const { preferences, setPreferences, location, homeLocation } = useAppContext()
  const { forecast } = useForecast(location)
  const [pushStatus, setPushStatus] = useState<string | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const backendReady = isBackendConfigured()

  async function enableNotifications() {
    setPushLoading(true)
    setPushStatus(null)
    try {
      const granted = await requestNotificationPermission()
      if (!granted) {
        setPreferences({ notificationsEnabled: false })
        setPushStatus('Notification permission was denied.')
        return
      }

      if (backendReady) {
        await subscribeToBackendPush({
          location,
          preferences,
          homeLocation,
          timezone: forecast?.timezone ?? null,
        })
        setPushStatus('Connected — morning reminders will be sent in English.')
      } else {
        setPushStatus('Browser notifications enabled. Set VITE_API_URL on Vercel for server push.')
      }

      setPreferences({ notificationsEnabled: true })
    } catch (err) {
      setPreferences({ notificationsEnabled: false })
      setPushStatus(err instanceof Error ? err.message : 'Could not enable notifications.')
    } finally {
      setPushLoading(false)
    }
  }

  async function testPush() {
    setPushLoading(true)
    setPushStatus(null)
    try {
      await sendTestPush()
      setPushStatus('Test notification sent.')
    } catch (err) {
      setPushStatus(err instanceof Error ? err.message : 'Test push failed.')
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <div className="page">
      <AccountSubpageHeader title="Notifications" />

      <Card>
        <label className="field-label" htmlFor="morning-time">
          Morning reminder (high-UV days only)
        </label>
        <input
          id="morning-time"
          type="time"
          className="time-input"
          value={preferences.morningCheckTime}
          onChange={(e) => setPreferences({ morningCheckTime: e.target.value })}
        />
        {!backendReady && (
          <p className="warning-text">
            Backend not linked — set <strong>VITE_API_URL</strong> on Vercel.
          </p>
        )}
        {forecast?.timezoneAbbreviation && (
          <p className="hint-text">
            Reminder time uses the forecast location timezone ({forecast.timezoneAbbreviation}).
          </p>
        )}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => void enableNotifications()}
          disabled={pushLoading || preferences.notificationsEnabled}
          style={{ marginTop: '0.75rem' }}
        >
          {pushLoading
            ? 'Connecting…'
            : preferences.notificationsEnabled
              ? 'Notifications enabled'
              : 'Enable notifications'}
        </Button>
        {preferences.notificationsEnabled && backendReady && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => void testPush()}
            disabled={pushLoading}
            style={{ marginTop: '0.5rem' }}
          >
            Send test push
          </Button>
        )}
        {pushStatus && <p className="hint-text">{pushStatus}</p>}
      </Card>
    </div>
  )
}

export function AccountTroubleshootingPage() {
  return (
    <div className="page">
      <AccountSubpageHeader title="Troubleshooting" />

      <Card>
        <p className="hint-text">Blank screen on your phone? Clear cached data and reload.</p>
        <Button variant="secondary" fullWidth onClick={() => void clearAppCacheAndReload()}>
          Clear cache and reload
        </Button>
      </Card>
    </div>
  )
}
