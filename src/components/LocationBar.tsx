import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { LocationPicker } from './LocationPicker'

export function LocationBar() {
  const { location, setLocation } = useAppContext()
  const [editing, setEditing] = useState(!location)

  if (editing || !location) {
    return (
      <LocationPicker
        onSelect={(loc) => {
          setLocation(loc)
          setEditing(false)
        }}
        onClose={location ? () => setEditing(false) : undefined}
      />
    )
  }

  return (
    <button type="button" className="location-bar" onClick={() => setEditing(true)}>
      <span className="location-bar__pin" aria-hidden>
        📍
      </span>
      <span className="location-bar__text">
        <span className="location-bar__label">{location.label}</span>
        <span className="location-bar__hint">Tap to change location</span>
      </span>
      <span className="location-bar__action">Change</span>
    </button>
  )
}
