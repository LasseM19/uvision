import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { AccountMenuLink } from '../components/AccountMenuLink'
import { Card } from '../components/Card'
import { PageBrandHeader } from '../components/PageBrandHeader'
import { useAppContext } from '../context/AppContext'
import { useI18n } from '../hooks/useI18n'
import { getSpfLabel } from '../lib/storage'

export function AccountPage() {
  const navigate = useNavigate()
  const { preferences, location, homeLocation, logout } = useAppContext()
  const { t } = useI18n()

  async function handleLogout() {
    await logout()
    navigate('/onboarding', { replace: true })
  }

  const languageLabel = preferences.language === 'nl' ? t('account.dutch') : t('account.english')

  return (
    <div className="page">
      <PageBrandHeader eyebrow={t('account.eyebrow')} title={t('account.title')} />

      <Card className="account-profile-card">
        <p className="account-profile-card__name">{t('common.guest')}</p>
        <p className="hint-text">{t('account.signInSoon')}</p>
      </Card>

      <nav className="account-menu" aria-label={t('account.title')}>
        <AccountMenuLink to="/account/profile" title={t('account.profile')} subtitle={t('account.guestAccount')} />
        <AccountMenuLink
          to="/account/location"
          title={t('account.forecastLocation')}
          subtitle={location?.label ?? t('common.notSet')}
        />
        <AccountMenuLink
          to="/account/skin"
          title={t('account.skinSpf')}
          subtitle={`Type ${preferences.skinType} · ${getSpfLabel(preferences.spf)}`}
        />
        <AccountMenuLink to="/account/language" title={t('account.language')} subtitle={languageLabel} />
        <AccountMenuLink
          to="/account/home"
          title={t('account.homeAlerts')}
          subtitle={
            homeLocation
              ? `${homeLocation.label} · ${homeLocation.radiusMeters} m`
              : t('common.notConfigured')
          }
        />
        <AccountMenuLink
          to="/account/notifications"
          title={t('account.notifications')}
          subtitle={preferences.notificationsEnabled ? t('common.enabled') : t('common.off')}
        />
        <AccountMenuLink to="/account/learn" title={t('account.learn')} subtitle={t('account.learnSubtitle')} />
        <AccountMenuLink to="/account/history" title={t('account.history')} subtitle={t('account.historySubtitle')} />
        <AccountMenuLink
          to="/account/troubleshooting"
          title={t('account.troubleshooting')}
          subtitle={t('account.troubleshootingSubtitle')}
        />
      </nav>

      <Button variant="ghost" fullWidth className="account-logout-btn" onClick={() => void handleLogout()}>
        {t('account.logout')}
      </Button>
    </div>
  )
}
