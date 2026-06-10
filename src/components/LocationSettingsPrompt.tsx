import { Button } from './Button'
import { Card } from './Card'
import { getLocationSettingsGuide, openLocationSettings } from '../lib/geolocation'

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

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">
        UVision needs your location for UV forecasts. Safari often blocks this until you allow it
        for this specific website.
      </p>
      <ol className="location-settings-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="location-settings-actions">
        <Button fullWidth onClick={openLocationSettings}>
          {guide.primaryActionLabel}
        </Button>
        <Button variant="secondary" fullWidth onClick={onTryAgain} disabled={trying}>
          {trying ? 'Finding you…' : guide.secondaryActionLabel}
        </Button>
      </div>
    </Card>
  )
}
