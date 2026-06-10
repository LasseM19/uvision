import { Button } from './Button'
import { Card } from './Card'
import { useI18n } from '../hooks/useI18n'
import { canOpenSystemLocationSettings, isIosDevice, isStandalonePwa, openLocationSettings } from '../lib/geolocation'

interface LocationSettingsPromptProps {
  visible: boolean
}

export function LocationSettingsPrompt({ visible }: LocationSettingsPromptProps) {
  const { t, locationSettingsGuide: guide } = useI18n()

  if (!visible) return null

  const showSystemSettings = canOpenSystemLocationSettings()
  const isSafariBrowser = guide.platform === 'ios-safari'
  const isPwa = isStandalonePwa()

  if (isSafariBrowser) {
    return (
      <div className="location-help-compact">
        <p className="location-help-compact__title">{t('locationHelp.safariTitle')}</p>
        <p className="location-help-compact__text">{t('locationHelp.safariText1')}</p>
        <p className="location-help-compact__text">{t('locationHelp.safariText2')}</p>
        <a className="location-help-compact__link" href="/safari-fix.html">
          {t('locationHelp.safariLink')}
        </a>
      </div>
    )
  }

  if (isIosDevice() && isPwa) {
    return (
      <div className="location-help-compact">
        <p className="location-help-compact__title">{t('locationHelp.pwaTitle')}</p>
        <p className="location-help-compact__text">{t('locationHelp.pwaText')}</p>
        {showSystemSettings && (
          <Button fullWidth onClick={openLocationSettings} style={{ marginTop: '0.75rem' }}>
            {t('locationHelp.openIphoneSettings')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="location-settings-prompt">
      <p className="location-settings-prompt__title">{guide.title}</p>
      <p className="hint-text">{t('locationHelp.needLocation')}</p>
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
