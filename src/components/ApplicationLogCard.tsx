import { Card } from './Card'
import { SwipeToDeleteRow } from './SwipeToDeleteRow'
import { getActivityLabel } from '../lib/storage'
import { formatTime } from '../lib/uvLogic'
import type { ApplicationLog } from '../types'

interface ApplicationLogCardProps {
  log: ApplicationLog
  onDelete: (id: string) => void
  variant?: 'compact' | 'full'
}

export function ApplicationLogCard({ log, onDelete, variant = 'full' }: ApplicationLogCardProps) {
  const appliedAt = new Date(log.appliedAt)

  return (
    <SwipeToDeleteRow onDelete={() => onDelete(log.id)}>
      <Card className="log-item">
        <div className="log-item__content">
          <p className="log-date">
            {variant === 'full'
              ? appliedAt.toLocaleString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : `${appliedAt.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })} · ${formatTime(appliedAt)}`}
          </p>
          <p className="log-meta">
            {variant === 'full' && `${log.locationLabel} · `}
            UV {log.uvAtApplication} · {getActivityLabel(log.activityMode)} · every{' '}
            {log.intervalMinutes} min
          </p>
        </div>
      </Card>
    </SwipeToDeleteRow>
  )
}
