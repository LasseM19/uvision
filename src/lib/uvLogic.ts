import type { WeatherIcon } from '../types'

export function effectiveUv(rawUv: number, cloudCoverPercent: number): number {
  const cloudFraction = Math.min(100, Math.max(0, cloudCoverPercent)) / 100
  return Math.round(rawUv * (1 - cloudFraction * 0.65) * 10) / 10
}

export function weatherIconFromConditions(
  cloudCover: number,
  precipitationProbability: number,
): WeatherIcon {
  if (precipitationProbability >= 50) return 'rainy'
  if (cloudCover >= 75) return 'cloudy'
  if (cloudCover >= 35) return 'partly-cloudy'
  return 'sunny'
}

export function uvRiskLabel(uv: number): string {
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very high'
  return 'Extreme'
}

export function uvRiskColor(uv: number): string {
  if (uv <= 2) return 'var(--color-success)'
  if (uv <= 5) return 'var(--color-orange)'
  if (uv <= 7) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function minutesUntil(isoDate: string): number {
  return Math.max(0, Math.round((new Date(isoDate).getTime() - Date.now()) / 60000))
}

export function recommendationFromForecast(
  maxEffectiveUv: number,
  hourlyEffective: number[],
): { recommendation: import('../types').DailyRecommendation; text: string } {
  const highHours = hourlyEffective.filter((uv) => uv >= 3).length

  if (maxEffectiveUv < 3) {
    return {
      recommendation: 'fine-without',
      text: "You're fine without sunscreen today — UV stays low.",
    }
  }

  if (maxEffectiveUv >= 6 || highHours >= 4) {
    return {
      recommendation: 'take-sunscreen',
      text: 'Take sunscreen today — UV will be strong during peak hours.',
    }
  }

  if (highHours >= 1 && maxEffectiveUv < 6) {
    return {
      recommendation: 'maybe-later',
      text: 'Maybe — check again this afternoon when UV could pick up.',
    }
  }

  return {
    recommendation: 'take-sunscreen',
    text: 'Take sunscreen today if you spend time outside.',
  }
}
