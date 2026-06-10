import { Card } from './Card'
import { SwipeToDeleteRow } from './SwipeToDeleteRow'
import { useI18n } from '../hooks/useI18n'
import type { ApplicationLog } from '../types'

interface ApplicationLogCardProps {
  log: ApplicationLog
  onDelete: (id: string) => void
  variant?: 'compact' | 'full'
}

export function ApplicationLogCard({ log, onDelete, variant = 'full' }: ApplicationLogCardProps) {
  const { t, activityLabel, formatTime, formatDateTime, formatDateShort } = useI18n()
  const appliedAt = new Date(log.appliedAt)
  const interval = t('log.everyMin', { minutes: log.intervalMinutes })

  return (
    <SwipeToDeleteRow onDelete={() => onDelete(log.id)}>
      <Card className="log-item">
        <div className="log-item__content">
          <p className="log-date">
            {variant === 'full'
              ? formatDateTime(appliedAt)
              : `${formatDateShort(appliedAt)} · ${formatTime(appliedAt)}`}
          </p>
          <p className="log-meta">
            {variant === 'full' && `${log.locationLabel} · `}
            {t('log.uvActivity', {
              uv: log.uvAtApplication,
              activity: activityLabel(log.activityMode),
              interval,
            })}
          </p>
        </div>
      </Card>
    </SwipeToDeleteRow>
  )
}
