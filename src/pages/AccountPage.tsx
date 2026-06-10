import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { HomeAddressSettings } from '../components/HomeAddressSettings'
import { LocationPicker } from '../components/LocationPicker'
import { useAppContext } from '../context/AppContext'
import { clearAppCacheAndReload } from '../lib/clearCache'
import { isBackendConfigured } from '../lib/api'
import { requestNotificationPermission } from '../lib/notifications'
import { sendTestPush, subscribeToBackendPush } from '../lib/pushBackend'
import { getSkinTypeLabel, getSpfLabel } from '../lib/storage'
import type { AppLanguage } from '../types'

export function AccountPage() {
  const {
    preferences,
    setPreferences,
    location,
    setLocation,
    homeLocation,
    setLiveTrackingEnabled,
    markLocationAccessGranted,
  } = useAppContext()
  const [showLocationPicker, setShowLocationPicker] = useState(false)
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
        await subscribeToBackendPush({ location, preferences, homeLocation })
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
      <header className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="page-title">Profile &amp; settings</h1>
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">Profile</h2>
        <Card>
          <p className="location-settings-current">Guest</p>
          <p className="hint-text">Sign in to sync your settings across devices.</p>
          <Button variant="secondary" fullWidth disabled style={{ marginTop: '0.75rem' }}>
            Sign in — coming soon
          </Button>
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">Forecast location</h2>
        {showLocationPicker ? (
          <LocationPicker
            onSelect={(loc) => {
              setLocation(loc)
              setShowLocationPicker(false)
            }}
            onClose={() => setShowLocationPicker(false)}
          />
        ) : (
          <Card className="location-settings-card">
            <p className="location-settings-current">{location?.label ?? 'No location set'}</p>
            <Button variant="secondary" fullWidth onClick={() => setShowLocationPicker(true)}>
              Change location
            </Button>
          </Card>
        )}
      </section>

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

      <section className="section">
        <h2 className="section-title">Language</h2>
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
      </section>

      <section className="section">
        <h2 className="section-title">Home &amp; leave alerts</h2>
        <HomeAddressSettings
          onHomeSaved={() => {
            if (preferences.leaveHomeAlertsEnabled) {
              markLocationAccessGranted()
              setLiveTrackingEnabled(true)
            }
          }}
        />
        <div className="section" style={{ marginTop: '0.75rem' }}>
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
          {!homeLocation && (
            <p className="hint-text">Set a home address above first.</p>
          )}
          </Card>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Notifications</h2>
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
      </section>

      <section className="section">
        <h2 className="section-title">Learn about UV</h2>
        <Card>
          <p className="hint-text">Tips on sunscreen, clouds, and UV risk.</p>
          <Link to="/account/learn">
            <Button variant="secondary" fullWidth style={{ marginTop: '0.75rem' }}>
              Open articles
            </Button>
          </Link>
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">History</h2>
        <Card>
          <Link to="/account/history" className="text-link">
            View full protection history →
          </Link>
        </Card>
      </section>

      <Link to="/onboarding">
        <Button variant="ghost" fullWidth>
          Redo setup
        </Button>
      </Link>

      <section className="section">
        <h2 className="section-title">Troubleshooting</h2>
        <Card>
          <p className="hint-text">Blank screen on your phone? Clear cached data and reload.</p>
          <Button variant="secondary" fullWidth onClick={() => void clearAppCacheAndReload()}>
            Clear cache and reload
          </Button>
        </Card>
      </section>
    </div>
  )
}
