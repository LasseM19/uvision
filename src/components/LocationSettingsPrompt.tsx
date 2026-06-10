import { Button } from './Button'
import { Card } from './Card'
import {
  canOpenSystemLocationSettings,
  getLocationSettingsGuide,
  openLocationSettings,
} from '../lib/geolocation'

interface LocationSettingsPromptProps {
  visible: boolean
}

export function LocationSettingsPrompt({ visible }: LocationSettingsPromptProps) {
  if (!visible) return null

  const guide = getLocationSettingsGuide()
  const showSystemSettings = canOpenSystemLocationSettings()
  const isSafariGuide = guide.platform === 'ios-safari'

  if (isSafariGuide) {
    return (
      <div className="location-help-compact">
        <p className="location-help-compact__title">Location blocked in Safari</p>
        <p className="location-help-compact__text">
          Tap <strong>Aa</strong> in the address bar → <strong>Website Settings</strong> →{' '}
          <strong>Location</strong> → <strong>Allow</strong>. Then tap{' '}
          <strong>Use my current location</strong> below, or search for your city.
        </p>
      </div>
    )
  }

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">UVision needs your location for UV forecasts.</p>
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
