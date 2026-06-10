import type { ReactNode } from 'react'
import { useI18n } from '../hooks/useI18n'
import type { TimerPhase } from '../lib/sunscreenTimer'

interface ActiveTimerStatusProps {
  phase: TimerPhase
  minutesLeft: number
  nextReapplyAt: Date | null
  timeZone?: string | null
  timezoneAbbreviation?: string | null
  compact?: boolean
  children?: ReactNode
}

function isTimerFinished(phase: TimerPhase): boolean {
  return phase === 'reapply-now' || phase === 'overdue'
}

export function ActiveTimerStatus({
  phase,
  minutesLeft,
  nextReapplyAt,
  timeZone,
  timezoneAbbreviation,
  compact = false,
  children,
}: ActiveTimerStatusProps) {
  const { t, timerPhaseLabel, formatDuration, formatTimeInZone } = useI18n()
  const finished = isTimerFinished(phase)
  const zone = timeZone ?? 'UTC'
  const reapplyTime = nextReapplyAt != null ? formatTimeInZone(nextReapplyAt, zone) : null
  const tzSuffix = timezoneAbbreviation ? ` ${timezoneAbbreviation}` : ''

  const countdownText = finished
    ? t('activeTimer.reapplyNow')
    : t('activeTimer.timeLeft', { duration: formatDuration(minutesLeft) })
  const reapplyHint =
    reapplyTime == null
      ? null
      : finished
        ? t('activeTimer.wasDueAt', { time: reapplyTime, tz: tzSuffix })
        : t('activeTimer.reapplyAt', { time: reapplyTime, tz: tzSuffix })

  return (
    <div
      className={[
        'active-timer',
        compact ? 'active-timer--compact' : '',
        finished ? 'active-timer--finished' : 'active-timer--running',
      ].join(' ')}
    >
      <div className="active-timer__header">
        <span className="active-timer__badge">
          <span className="active-timer__dot" aria-hidden />
          {finished ? t('activeTimer.timerFinished') : t('activeTimer.timerRunning')}
        </span>
        <span className="active-timer__phase">{timerPhaseLabel(phase)}</span>
      </div>

      <p
        className={`timer-countdown${compact ? '' : ' timer-countdown--large'}${finished ? ' timer-countdown--urgent' : ''}`}
      >
        {countdownText}
      </p>

      {reapplyHint && <p className="active-timer__reapply-hint">{reapplyHint}</p>}

      {children}
    </div>
  )
}

export { isTimerFinished }
