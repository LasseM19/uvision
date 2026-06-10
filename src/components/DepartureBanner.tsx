import { Button } from './Button'
import { Card } from './Card'
import type { DepartureAlertCopy } from '../lib/notifications'
import { useI18n } from '../hooks/useI18n'

interface DepartureBannerProps {
  copy: DepartureAlertCopy
  onDismiss: () => void
  onApply: () => void
}

export function DepartureBanner({ copy, onDismiss, onApply }: DepartureBannerProps) {
  const { t } = useI18n()

  return (
    <Card className="departure-banner">
      <p className="departure-banner__title">{copy.title}</p>
      <p className="departure-banner__body">{copy.body}</p>
      <div className="departure-banner__actions">
        <Button fullWidth onClick={onApply}>
          {t('departure.logSunscreen')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onDismiss}>
          {t('departure.dismiss')}
        </Button>
      </div>
    </Card>
  )
}
