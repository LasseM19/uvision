import { Button } from './Button'
import { Card } from './Card'
import {
  canOpenSystemLocationSettings,
  getLocationSettingsGuide,
  openLocationSettings,
} from '../lib/geolocation'

interface LocationSettingsPromptProps {
  visible: boolean
  onTryAgain: () => void
  trying?: boolean
}

export function LocationSettingsPrompt({
  visible,
  onTryAgain,
  trying = false,
}: LocationSettingsPromptProps) {
  if (!visible) return null

  const guide = getLocationSettingsGuide()
  const showSystemSettings = canOpenSystemLocationSettings()

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">
        {guide.platform === 'ios-safari'
          ? 'Allow location for this website inside Safari — not only in iPhone Settings.'
          : 'UVision needs your location for UV forecasts.'}
      </p>
      <ol className="location-settings-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="location-settings-actions">
        {showSystemSettings && (
          <Button fullWidth onClick={openLocationSettings}>
            {guide.primaryActionLabel}
          </Button>
        )}
        <Button variant={showSystemSettings ? 'secondary' : 'primary'} fullWidth onClick={onTryAgain} disabled={trying}>
          {trying ? 'Finding you…' : guide.secondaryActionLabel}
        </Button>
      </div>
    </Card>
  )
}
