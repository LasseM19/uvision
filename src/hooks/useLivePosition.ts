import { useEffect, useState } from 'react'
import type { LivePosition } from '../types'
import {
  geolocationErrorMessage,
  isPermissionDeniedError,
  isSecureContextForGeolocation,
  watchGeolocationPosition,
} from '../lib/geolocation'

interface UseLivePositionResult {
  position: LivePosition | null
  error: string | null
  loading: boolean
}

export function useLivePosition(enabled: boolean): UseLivePositionResult {
  const [position, setPosition] = useState<LivePosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    if (!isSecureContextForGeolocation()) {
      setError('Location requires a secure connection (https).')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const stop = watchGeolocationPosition(
      (geo) => {
        setPosition({
          latitude: geo.coords.latitude,
          longitude: geo.coords.longitude,
          accuracy: geo.coords.accuracy ?? null,
          updatedAt: geo.timestamp,
        })
        setLoading(false)
        setError(null)
      },
      (err) => {
        if (!isPermissionDeniedError(err)) {
          setError(geolocationErrorMessage(err))
        }
        setLoading(false)
      },
    )

    return stop
  }, [enabled])

  return { position, error, loading }
}
