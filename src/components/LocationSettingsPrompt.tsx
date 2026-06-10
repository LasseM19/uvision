import { Button } from './Button'
import { Card } from './Card'
import {
  canOpenSystemLocationSettings,
  getLocationSettingsGuide,
  isIosDevice,
  isStandalonePwa,
  openLocationSettings,
} from '../lib/geolocation'

interface LocationSettingsPromptProps {
  visible: boolean
}

export function LocationSettingsPrompt({ visible }: LocationSettingsPromptProps) {
  if (!visible) return null

  const guide = getLocationSettingsGuide()
  const showSystemSettings = canOpenSystemLocationSettings()
  const isSafariBrowser = guide.platform === 'ios-safari'
  const isPwa = isStandalonePwa()

  if (isSafariBrowser) {
    return (
      <div className="location-help-compact">
        <p className="location-help-compact__title">Location blocked in Safari</p>
        <p className="location-help-compact__text">
          Tap the <strong>page menu</strong> left of the address bar (often <strong>Aa</strong> or{' '}
          <strong>☰</strong>) → <strong>Website Settings</strong> → <strong>Location</strong> →{' '}
          <strong>Allow</strong>.
        </p>
        <p className="location-help-compact__text">
          If you tapped <strong>Don&apos;t Allow</strong> before, Safari will not ask again until
          you change this setting. Then tap the location button below.
        </p>
        <a className="location-help-compact__link" href="/safari-fix.html">
          Still stuck? Reset Safari site data →
        </a>
      </div>
    )
  }

  if (isIosDevice() && isPwa) {
    return (
      <div className="location-help-compact">
        <p className="location-help-compact__title">Location blocked for UVision</p>
        <p className="location-help-compact__text">
          Open iPhone <strong>Settings</strong> → scroll to <strong>UVision</strong> →{' '}
          <strong>Location</strong> → choose <strong>While Using the App</strong>. Also check{' '}
          <strong>Settings → Privacy &amp; Security → Location Services</strong> is on.
        </p>
        {showSystemSettings && (
          <Button fullWidth onClick={openLocationSettings} style={{ marginTop: '0.75rem' }}>
            Open iPhone Settings
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">UVision needs your location for UV forecasts and the map.</p>
      <ol className="location-settings-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {showSystemSettings && (
        <div className="location-settings-actions">
          <Button fullWidth onClick={openLocationSettings}>
            {guide.primaryActionLabel}
          </Button>
        </div>
      )}
    </Card>
  )
}
