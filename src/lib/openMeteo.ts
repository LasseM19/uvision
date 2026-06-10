import type { DailyForecast, ForecastData, HourlyForecast, Location } from '../types'
import {
  effectiveUv,
  recommendationFromForecast,
  weatherIconFromConditions,
} from './uvLogic'

interface OpenMeteoHourly {
  time: string[]
  uv_index: number[]
  cloud_cover: number[]
  precipitation_probability: number[]
}

interface OpenMeteoDaily {
  time: string[]
  uv_index_max: number[]
  cloud_cover_mean: number[]
  precipitation_probability_max: number[]
}

interface OpenMeteoResponse {
  hourly: OpenMeteoHourly
  daily: OpenMeteoDaily
}

function parseHourly(hourly: OpenMeteoHourly, dayStart: Date, dayEnd: Date): HourlyForecast[] {
  return hourly.time
    .map((time, i) => {
      const date = new Date(time)
      const uvIndex = hourly.uv_index[i] ?? 0
      const cloudCover = hourly.cloud_cover[i] ?? 0
      const precipitationProbability = hourly.precipitation_probability[i] ?? 0
      return {
        time: date,
        uvIndex,
        effectiveUv: effectiveUv(uvIndex, cloudCover),
        cloudCover,
        precipitationProbability,
        weatherIcon: weatherIconFromConditions(cloudCover, precipitationProbability),
      }
    })
    .filter((h) => h.time >= dayStart && h.time < dayEnd)
}

function parseDaily(daily: OpenMeteoDaily): DailyForecast[] {
  return daily.time.map((time, i) => {
    const maxUv = daily.uv_index_max[i] ?? 0
    const avgCloudCover = daily.cloud_cover_mean[i] ?? 0
    const maxPrecipitationProbability = daily.precipitation_probability_max[i] ?? 0
    return {
      date: new Date(time),
      maxUv,
      maxEffectiveUv: effectiveUv(maxUv, avgCloudCover),
      avgCloudCover,
      maxPrecipitationProbability,
      weatherIcon: weatherIconFromConditions(avgCloudCover, maxPrecipitationProbability),
      peakHour: null,
    }
  })
}

function attachPeakHours(hourlyToday: HourlyForecast[], daily: DailyForecast[]): DailyForecast[] {
  if (daily.length === 0) return daily

  const todayPeak = hourlyToday.reduce<HourlyForecast | null>((best, hour) => {
    if (!best || hour.effectiveUv > best.effectiveUv) return hour
    return best
  }, null)

  return daily.map((day, index) => {
    if (index !== 0) return day
    return { ...day, peakHour: todayPeak?.time ?? null }
  })
}

export async function fetchForecast(location: Location): Promise<ForecastData> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: 'uv_index,cloud_cover,precipitation_probability',
    daily: 'uv_index_max,cloud_cover_mean,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '4',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error('Could not load UV forecast. Please try again.')

  const data = (await response.json()) as OpenMeteoResponse

  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const hourlyToday = parseHourly(data.hourly, dayStart, dayEnd)
  let daily = parseDaily(data.daily)
  daily = attachPeakHours(hourlyToday, daily)

  const today = daily[0]
  const maxEffectiveUv = today?.maxEffectiveUv ?? 0
  const hourlyEffective = hourlyToday.map((h) => h.effectiveUv)
  const { recommendation, text } = recommendationFromForecast(maxEffectiveUv, hourlyEffective)

  return {
    location,
    hourlyToday,
    daily,
    recommendation,
    recommendationText: text,
  }
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  label: string
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    name: query.trim(),
    count: '8',
    language: 'en',
    format: 'json',
  })

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!response.ok) throw new Error('City search failed')

  const data = (await response.json()) as {
    results?: Array<{
      name: string
      admin1?: string
      country: string
      latitude: number
      longitude: number
    }>
  }

  return (data.results ?? []).map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }))
}
