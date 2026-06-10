import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { AccountMenuLink } from '../components/AccountMenuLink'
import { Card } from '../components/Card'
import { PageBrandHeader } from '../components/PageBrandHeader'
import { useAppContext } from '../context/AppContext'
import { getSpfLabel } from '../lib/storage'

export function AccountPage() {
  const navigate = useNavigate()
  const { preferences, location, homeLocation, logout } = useAppContext()

  async function handleLogout() {
    await logout()
    navigate('/onboarding', { replace: true })
  }

  const languageLabel = preferences.language === 'nl' ? 'Nederlands' : 'English'

  return (
    <div className="page">
      <PageBrandHeader eyebrow="Account" title="Settings" />

      <Card className="account-profile-card">
        <p className="account-profile-card__name">Guest</p>
        <p className="hint-text">Sign in to sync across devices — coming soon.</p>
      </Card>

      <nav className="account-menu" aria-label="Account sections">
        <AccountMenuLink to="/account/profile" title="Profile" subtitle="Guest account" />
        <AccountMenuLink
          to="/account/location"
          title="Forecast location"
          subtitle={location?.label ?? 'Not set'}
        />
        <AccountMenuLink
          to="/account/skin"
          title="Skin & SPF"
          subtitle={`Type ${preferences.skinType} · ${getSpfLabel(preferences.spf)}`}
        />
        <AccountMenuLink to="/account/language" title="Language" subtitle={languageLabel} />
        <AccountMenuLink
          to="/account/home"
          title="Home & alerts"
          subtitle={
            homeLocation
              ? `${homeLocation.label} · ${homeLocation.radiusMeters} m`
              : 'Not configured'
          }
        />
        <AccountMenuLink
          to="/account/notifications"
          title="Notifications"
          subtitle={preferences.notificationsEnabled ? 'Enabled' : 'Off'}
        />
        <AccountMenuLink to="/account/learn" title="Learn about UV" subtitle="Sun safety tips" />
        <AccountMenuLink
          to="/account/history"
          title="History"
          subtitle="Protection log"
        />
        <AccountMenuLink
          to="/account/troubleshooting"
          title="Troubleshooting"
          subtitle="Cache & Safari fixes"
        />
      </nav>

      <Button variant="ghost" fullWidth className="account-logout-btn" onClick={() => void handleLogout()}>
        Log out
      </Button>
    </div>
  )
}
