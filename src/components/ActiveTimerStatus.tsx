import type { ReactNode } from 'react'
import { formatTimeInZone } from '../lib/timezone'
import { timerPhaseLabel, type TimerPhase } from '../lib/sunscreenTimer'
import { formatDuration } from '../lib/uvLogic'

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
  const finished = isTimerFinished(phase)
  const zone = timeZone ?? 'UTC'
  const reapplyTime =
    nextReapplyAt != null ? formatTimeInZone(nextReapplyAt, zone) : null
  const tzSuffix = timezoneAbbreviation ? ` ${timezoneAbbreviation}` : ''

  const countdownText = finished ? 'Reapply now!' : `${formatDuration(minutesLeft)} left`
  const reapplyHint =
    reapplyTime == null
      ? null
      : finished
        ? `Was due at ${reapplyTime}${tzSuffix}`
        : `Reapply at ${reapplyTime}${tzSuffix}`

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
          {finished ? 'Timer finished' : 'Timer running'}
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
