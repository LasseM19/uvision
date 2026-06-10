import { useEffect } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { HomeLocation, LivePosition, Location } from '../types'
import { distanceMeters, formatDistance } from '../lib/geofence'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const homeIcon = L.divIcon({
  className: 'map-home-marker',
  html: '<span aria-hidden="true">🏠</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const userIcon = L.divIcon({
  className: 'map-user-marker',
  html: '<span aria-hidden="true">●</span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

L.Marker.prototype.options.icon = defaultIcon

interface LocationMapProps {
  home: HomeLocation | null
  livePosition: LivePosition | null
  fallbackLocation: Location | null
  className?: string
  height?: number
}

function MapViewport({
  livePosition,
  home,
  fallbackLocation,
}: Pick<LocationMapProps, 'livePosition' | 'home' | 'fallbackLocation'>) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []
    if (livePosition) points.push([livePosition.latitude, livePosition.longitude])
    if (home) points.push([home.latitude, home.longitude])
    if (fallbackLocation) points.push([fallbackLocation.latitude, fallbackLocation.longitude])

    if (points.length === 0) return

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true })
      return
    }

    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16, animate: true })
  }, [livePosition, home, fallbackLocation, map])

  return null
}

export function LocationMap({
  home,
  livePosition,
  fallbackLocation,
  className = '',
  height = 280,
}: LocationMapProps) {
  const center = livePosition
    ? ([livePosition.latitude, livePosition.longitude] as [number, number])
    : home
      ? ([home.latitude, home.longitude] as [number, number])
      : fallbackLocation
        ? ([fallbackLocation.latitude, fallbackLocation.longitude] as [number, number])
        : ([52.37, 4.89] as [number, number])

  const distanceFromHome =
    home && livePosition
      ? distanceMeters(
          livePosition.latitude,
          livePosition.longitude,
          home.latitude,
          home.longitude,
        )
      : null

  return (
    <div className={`location-map-wrap ${className}`.trim()}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        className="location-map"
        style={{ height }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport livePosition={livePosition} home={home} fallbackLocation={fallbackLocation} />

        {home && (
          <>
            <Marker position={[home.latitude, home.longitude]} icon={homeIcon} />
            <Circle
              center={[home.latitude, home.longitude]}
              radius={home.radiusMeters}
              pathOptions={{
                color: 'var(--color-orange)',
                fillColor: 'var(--color-orange)',
                fillOpacity: 0.12,
                weight: 2,
              }}
            />
          </>
        )}

        {livePosition && (
          <Marker position={[livePosition.latitude, livePosition.longitude]} icon={userIcon} />
        )}
      </MapContainer>

      <div className="location-map-legend">
        <span className="location-map-legend__item">
          <span className="location-map-legend__dot location-map-legend__dot--you" aria-hidden />
          You
        </span>
        {home && (
          <span className="location-map-legend__item">
            <span className="location-map-legend__dot location-map-legend__dot--home" aria-hidden />
            Home ({home.radiusMeters} m)
          </span>
        )}
      </div>

      {distanceFromHome !== null && home && (
        <p className="location-map-distance">
          {distanceFromHome <= home.radiusMeters
            ? 'You are at home (within your home area).'
            : `${formatDistance(distanceFromHome)} from home`}
        </p>
      )}
    </div>
  )
}
