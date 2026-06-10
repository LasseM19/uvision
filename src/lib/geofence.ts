import type { HomeLocation } from '../types'

const EARTH_RADIUS_M = 6_371_000

export function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const lat1 = (latitudeA * Math.PI) / 180
  const lat2 = (latitudeB * Math.PI) / 180
  const deltaLat = ((latitudeB - latitudeA) * Math.PI) / 180
  const deltaLon = ((longitudeB - longitudeA) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinHomeRadius(
  latitude: number,
  longitude: number,
  home: HomeLocation,
): boolean {
  return distanceMeters(latitude, longitude, home.latitude, home.longitude) <= home.radiusMeters
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}
