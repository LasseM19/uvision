export type SkinType = 1 | 2 | 3 | 4 | 5 | 6
export type SpfLevel = 15 | 30 | 50
export type ActivityMode = 'normal' | 'swimming' | 'sports'

export type WeatherIcon = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy'

export type DailyRecommendation =
  | 'take-sunscreen'
  | 'fine-without'
  | 'maybe-later'

export interface Location {
  latitude: number
  longitude: number
  label: string
}

export type HomeGeofenceRadius = 100 | 150 | 200 | 300

export interface HomeLocation {
  latitude: number
  longitude: number
  label: string
  radiusMeters: HomeGeofenceRadius
  setAt: string
}

export interface LivePosition {
  latitude: number
  longitude: number
  accuracy: number | null
  updatedAt: number
}

export interface UserPreferences {
  skinType: SkinType
  spf: SpfLevel
  morningCheckTime: string
  onboardingComplete: boolean
  notificationsEnabled: boolean
  leaveHomeAlertsEnabled: boolean
  homeGeofenceRadiusMeters: HomeGeofenceRadius
}

export interface HourlyForecast {
  time: Date
  uvIndex: number
  effectiveUv: number
  cloudCover: number
  precipitationProbability: number
  weatherIcon: WeatherIcon
}

export interface DailyForecast {
  date: Date
  maxUv: number
  maxEffectiveUv: number
  avgCloudCover: number
  maxPrecipitationProbability: number
  weatherIcon: WeatherIcon
  peakHour: Date | null
}

export interface ForecastData {
  location: Location
  hourlyToday: HourlyForecast[]
  daily: DailyForecast[]
  recommendation: DailyRecommendation
  recommendationText: string
}

export interface ApplicationLog {
  id: string
  appliedAt: string
  uvAtApplication: number
  activityMode: ActivityMode
  locationLabel: string
  intervalMinutes: number
}

export type TimerStatus = 'idle' | 'protected' | 'due-soon' | 'reapply-now' | 'overdue'

export interface ActiveTimer {
  appliedAt: string
  intervalMinutes: number
  activityMode: ActivityMode
  uvAtApplication: number
  nextReapplyAt: string
}

export interface StoredState {
  preferences: UserPreferences
  location: Location | null
  homeLocation: HomeLocation | null
  lastDepartureAlertDate: string | null
  applicationLogs: ApplicationLog[]
  activeTimer: ActiveTimer | null
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  skinType: 3,
  spf: 30,
  morningCheckTime: '08:00',
  onboardingComplete: false,
  notificationsEnabled: false,
  leaveHomeAlertsEnabled: false,
  homeGeofenceRadiusMeters: 150,
}
