import type { AppLanguage } from '../types'

export interface AddressSearchResult {
  latitude: number
  longitude: number
  label: string
}

interface PhotonProperties {
  name?: string
  housenumber?: string
  street?: string
  city?: string
  state?: string
  country?: string
  postcode?: string
}

interface NominatimAddress {
  house_number?: string
  road?: string
  pedestrian?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  postcode?: string
  country?: string
}

const NOMINATIM_HEADERS = {
  'User-Agent': 'UVision/1.0 (home geofence; contact: uvision-app)',
  Accept: 'application/json',
}

function formatPhotonLabel(properties: PhotonProperties): string {
  const streetLine = [properties.street || properties.name, properties.housenumber]
    .filter(Boolean)
    .join(' ')
    .trim()

  const city = properties.city || properties.state
  const parts = [streetLine, properties.postcode, city, properties.country].filter(Boolean)

  const seen = new Set<string>()
  const unique = parts.filter((part): part is string => {
    if (!part) return false
    const key = part.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.join(', ') || streetLine || city || properties.country || 'Address'
}

function formatNominatimLabel(address: NominatimAddress): string | null {
  const streetLine = [address.road || address.pedestrian, address.house_number]
    .filter(Boolean)
    .join(' ')
    .trim()
  const city = address.city || address.town || address.village || address.municipality
  const parts = [streetLine, address.postcode, city, address.country].filter(Boolean)

  if (parts.length === 0) return null

  const seen = new Set<string>()
  const unique = parts.filter((part): part is string => {
    if (!part) return false
    const key = part.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.join(', ')
}

/** Street-level forward geocoding for home address setup. */
export async function searchAddresses(
  query: string,
  bias?: { latitude: number; longitude: number },
): Promise<AddressSearchResult[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query.trim(),
    limit: '8',
    lang: 'default',
  })

  if (bias) {
    params.set('lat', String(bias.latitude))
    params.set('lon', String(bias.longitude))
  }

  const response = await fetch(`https://photon.komoot.io/api/?${params}`)
  if (!response.ok) throw new Error('Address search failed')

  const data = (await response.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number] }
      properties: PhotonProperties
    }>
  }

  const seen = new Set<string>()

  return (data.features ?? [])
    .map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates
      const label = formatPhotonLabel(feature.properties)
      return { latitude, longitude, label }
    })
    .filter((result) => {
      const key = `${result.latitude.toFixed(5)}:${result.longitude.toFixed(5)}:${result.label}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

/** Building-level reverse geocoding when saving home from GPS. */
export async function reverseGeocodeHomeAddress(
  latitude: number,
  longitude: number,
  lang: AppLanguage = 'en',
): Promise<string> {
  const fallback = `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        ...NOMINATIM_HEADERS,
        'Accept-Language': lang === 'nl' ? 'nl-NL,nl' : 'en',
      },
    })

    if (!response.ok) return fallback

    const data = (await response.json()) as { address?: NominatimAddress }
    const label = data.address ? formatNominatimLabel(data.address) : null
    return label || fallback
  } catch {
    return fallback
  }
}
