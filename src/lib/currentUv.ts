import type { HourlyForecast } from '../types'

/** Effective UV at `now`, interpolated between hourly forecast points. */
export function getCurrentEffectiveUv(
  hourlyToday: HourlyForecast[] | undefined,
  fallbackUv = 0,
  nowMs = Date.now(),
): number {
  if (!hourlyToday?.length) return fallbackUv

  const firstMs = hourlyToday[0].time.getTime()
  if (nowMs <= firstMs) return hourlyToday[0].effectiveUv

  for (let i = 0; i < hourlyToday.length - 1; i += 1) {
    const startMs = hourlyToday[i].time.getTime()
    const endMs = hourlyToday[i + 1].time.getTime()
    if (nowMs >= startMs && nowMs <= endMs) {
      const fraction = (nowMs - startMs) / (endMs - startMs)
      const value =
        hourlyToday[i].effectiveUv +
        fraction * (hourlyToday[i + 1].effectiveUv - hourlyToday[i].effectiveUv)
      return Math.round(value * 10) / 10
    }
  }

  return hourlyToday[hourlyToday.length - 1].effectiveUv
}
