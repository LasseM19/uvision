import { Button } from './Button'
import { Card } from './Card'
import type { DepartureAlertCopy } from '../lib/notifications'

interface DepartureBannerProps {
  copy: DepartureAlertCopy
  onDismiss: () => void
  onApply: () => void
}

export function DepartureBanner({ copy, onDismiss, onApply }: DepartureBannerProps) {
  return (
    <Card className="departure-banner">
      <p className="departure-banner__title">{copy.title}</p>
      <p className="departure-banner__body">{copy.body}</p>
      <div className="departure-banner__actions">
        <Button fullWidth onClick={onApply}>
          Log sunscreen
        </Button>
        <Button variant="ghost" fullWidth onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Card>
  )
}
