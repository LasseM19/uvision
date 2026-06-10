import { Button } from './Button'
import { Card } from './Card'
import {
  getLocationSettingsGuide,
  openLocationSettings,
  type GeolocationPermission,
} from '../lib/geolocation'

interface LocationSettingsPromptProps {
  permission: GeolocationPermission
  onTryAgain: () => void
  trying?: boolean
}

export function LocationSettingsPrompt({
  permission,
  onTryAgain,
  trying = false,
}: LocationSettingsPromptProps) {
  const show = permission === 'denied'
  if (!show) return null

  const guide = getLocationSettingsGuide()

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">
        UVision needs your location for accurate UV forecasts. Location is currently blocked.
      </p>
      <ol className="location-settings-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="location-settings-actions">
        <Button fullWidth onClick={openLocationSettings}>
          {guide.settingsLabel}
        </Button>
        <Button variant="secondary" fullWidth onClick={onTryAgain} disabled={trying}>
          {trying ? 'Checking…' : 'Try again'}
        </Button>
      </div>
    </Card>
  )
}
