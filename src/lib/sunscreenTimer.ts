import type { ActiveTimer, ActivityMode, SkinType, SpfLevel } from '../types'

/** Minutes between applications when UV is low but a timer is already running. */
const LOW_UV_TIMER_MINUTES = 120

export function baseIntervalMinutes(uv: number): number | null {
  if (uv <= 2) return null
  if (uv <= 5) return 120
  if (uv <= 7) return 90
  return 60
}

export function calculateReapplyInterval(
  uv: number,
  skinType: SkinType,
  spf: SpfLevel,
  activity: ActivityMode,
): number | null {
  const base = baseIntervalMinutes(uv)
  if (base === null) return null

  let interval = base

  if (skinType <= 2) interval -= 15
  if (skinType >= 5) interval += 15
  if (spf === 15) interval -= 15
  if (spf === 50) interval += 15
  if (activity === 'sports') interval -= 20
  if (activity === 'swimming') interval = Math.min(interval, 40)

  return Math.max(30, interval)
}

export function buildTimerSchedule(
  appliedAt: Date,
  intervalMinutes: number,
): { nextReapplyAt: string } {
  const next = new Date(appliedAt.getTime() + intervalMinutes * 60_000)
  return { nextReapplyAt: next.toISOString() }
}

export type TimerPhase = 'idle' | 'protected' | 'due-soon' | 'reapply-now' | 'overdue'

export function getTimerPhase(nextReapplyAt: string): TimerPhase {
  const minutesLeft = (new Date(nextReapplyAt).getTime() - Date.now()) / 60_000
  if (minutesLeft > 15) return 'protected'
  if (minutesLeft > 0) return 'due-soon'
  if (minutesLeft > -30) return 'reapply-now'
  return 'overdue'
}

export function timerPhaseLabel(phase: TimerPhase): string {
  const labels: Record<TimerPhase, string> = {
    idle: 'No active protection',
    protected: 'Protected',
    'due-soon': 'Due soon',
    'reapply-now': 'Reapply now',
    overdue: 'Overdue — reapply!',
  }
  return labels[phase]
}

export interface LiveTimerState {
  phase: TimerPhase
  minutesLeft: number
  intervalMinutes: number | null
  nextReapplyAt: Date
  currentUv: number
}

/** Live countdown from application time using the current UV level. */
export function computeLiveTimerState(
  timer: ActiveTimer,
  currentUv: number,
  skinType: SkinType,
  spf: SpfLevel,
  nowMs = Date.now(),
): LiveTimerState {
  const appliedAt = new Date(timer.appliedAt)
  const intervalMinutes =
    calculateReapplyInterval(currentUv, skinType, spf, timer.activityMode) ?? LOW_UV_TIMER_MINUTES
  const nextReapplyAt = new Date(appliedAt.getTime() + intervalMinutes * 60_000)
  const minutesLeft = Math.max(0, Math.round((nextReapplyAt.getTime() - nowMs) / 60_000))

  return {
    phase: getTimerPhase(nextReapplyAt.toISOString()),
    minutesLeft,
    intervalMinutes:
      calculateReapplyInterval(currentUv, skinType, spf, timer.activityMode) ?? null,
    nextReapplyAt,
    currentUv,
  }
}
