import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { AccountSubpageHeader } from '../../components/AccountSubpageHeader'
import { HomeAddressSettings } from '../../components/HomeAddressSettings'
import { LocationPicker } from '../../components/LocationPicker'
import { useAppContext } from '../../context/AppContext'
import { useForecast } from '../../hooks/useForecast'
import { useI18n } from '../../hooks/useI18n'
import { clearAppCacheAndReload } from '../../lib/clearCache'
import { isBackendConfigured } from '../../lib/api'
import { requestNotificationPermission } from '../../lib/notifications'
import { sendTestPush, subscribeToBackendPush } from '../../lib/pushBackend'
import { getSpfLabel } from '../../lib/storage'
import type { AppLanguage } from '../../types'

export function AccountProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAppContext()
  const { t } = useI18n()

  async function handleLogout() {
    await logout()
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="page">
      <AccountSubpageHeader title={t('profile.title')} />

      <Card>
        <p className="location-settings-current">{t('common.guest')}</p>
        <p className="hint-text">{t('profile.guestHint')}</p>
        <Button variant="secondary" fullWidth disabled style={{ marginTop: '0.75rem' }}>
          {t('profile.signInSoon')}
        </Button>
      </Card>

      <Button
        variant="ghost"
        fullWidth
        className="account-logout-btn"
        style={{ marginTop: '1rem' }}
        onClick={() => void handleLogout()}
      >
        {t('account.logout')}
      </Button>
    </div>
  )
}

export function AccountLocationPage() {
  const { location, setLocation } = useAppContext()
  const { t } = useI18n()
  const [showLocationPicker, setShowLocationPicker] = useState(!location)

  return (
    <div className="page">
      <AccountSubpageHeader title={t('locationPage.title')} />

      <p className="hint-text">{t('locationPage.hint')}</p>

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
            {t('locationPage.changeLocation')}
          </Button>
        </Card>
      )}
    </div>
  )
}

export function AccountSkinPage() {
  const { preferences, setPreferences } = useAppContext()
  const { t, skinTypeLabel } = useI18n()

  return (
    <div className="page">
      <AccountSubpageHeader title={t('skinPage.title')} />

      <section className="section">
        <h2 className="section-title">{t('skinPage.skinType')}</h2>
        <div className="option-list">
          {([1, 2, 3, 4, 5, 6] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`option-row${preferences.skinType === type ? ' option-row--active' : ''}`}
              onClick={() => setPreferences({ skinType: type })}
            >
              <span>{t('skinPage.typeN', { n: type })}</span>
              <span className="option-sub">{skinTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{t('skinPage.spf')}</h2>
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
  const { t } = useI18n()

  return (
    <div className="page">
      <AccountSubpageHeader title={t('account.language')} />

      <div className="pill-group">
        {(
          [
            { value: 'en' as AppLanguage, label: t('account.english') },
            { value: 'nl' as AppLanguage, label: t('account.dutch') },
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
      <p className="hint-text">{t('account.languageHint')}</p>
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
  const { t } = useI18n()

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
      <AccountSubpageHeader title={t('homeAlerts.title')} />

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
          <p className="hint-text">{t('homeAlerts.leaveHint')}</p>
          <Button
            variant={preferences.leaveHomeAlertsEnabled ? 'secondary' : 'primary'}
            fullWidth
            style={{ marginTop: '0.75rem' }}
            onClick={toggleLeaveHomeAlerts}
            disabled={!homeLocation && !preferences.leaveHomeAlertsEnabled}
          >
            {preferences.leaveHomeAlertsEnabled ? t('homeAlerts.alertsOn') : t('homeAlerts.enableAlerts')}
          </Button>
          {!homeLocation && <p className="hint-text">{t('homeAlerts.setHomeFirst')}</p>}
        </Card>
      </div>
    </div>
  )
}

export function AccountNotificationsPage() {
  const { preferences, setPreferences, location, homeLocation } = useAppContext()
  const { forecast } = useForecast(location, preferences.language)
  const { t } = useI18n()
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
        setPushStatus(t('notifications.permissionDenied'))
        return
      }

      if (backendReady) {
        await subscribeToBackendPush({
          location,
          preferences,
          homeLocation,
          timezone: forecast?.timezone ?? null,
        })
        setPushStatus(t('notifications.connected'))
      } else {
        setPushStatus(t('notifications.browserOnly'))
      }

      setPreferences({ notificationsEnabled: true })
    } catch (err) {
      setPreferences({ notificationsEnabled: false })
      setPushStatus(err instanceof Error ? err.message : t('notifications.enableFailed'))
    } finally {
      setPushLoading(false)
    }
  }

  async function testPush() {
    setPushLoading(true)
    setPushStatus(null)
    try {
      await sendTestPush()
      setPushStatus(t('notifications.testSent'))
    } catch (err) {
      setPushStatus(err instanceof Error ? err.message : t('notifications.testFailed'))
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <div className="page">
      <AccountSubpageHeader title={t('notifications.title')} />

      <Card>
        <label className="field-label" htmlFor="morning-time">
          {t('notifications.morningLabel')}
        </label>
        <input
          id="morning-time"
          type="time"
          className="time-input"
          value={preferences.morningCheckTime}
          onChange={(e) => setPreferences({ morningCheckTime: e.target.value })}
        />
        {!backendReady && (
          <p className="warning-text">{t('notifications.backendMissing')}</p>
        )}
        {forecast?.timezoneAbbreviation && (
          <p className="hint-text">
            {t('notifications.timezoneHint', { tz: forecast.timezoneAbbreviation })}
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
            ? t('common.connecting')
            : preferences.notificationsEnabled
              ? t('notifications.enabled')
              : t('notifications.enable')}
        </Button>
        {preferences.notificationsEnabled && backendReady && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => void testPush()}
            disabled={pushLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {t('notifications.sendTest')}
          </Button>
        )}
        {pushStatus && <p className="hint-text">{pushStatus}</p>}
      </Card>
    </div>
  )
}

export function AccountTroubleshootingPage() {
  const { t } = useI18n()

  return (
    <div className="page">
      <AccountSubpageHeader title={t('troubleshooting.title')} />

      <Card>
        <p className="hint-text">{t('troubleshooting.hint')}</p>
        <Button variant="secondary" fullWidth onClick={() => void clearAppCacheAndReload()}>
          {t('troubleshooting.clearCache')}
        </Button>
      </Card>
    </div>
  )
}
