import type { WeatherIcon } from '../types'

const icons: Record<WeatherIcon, string> = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  rainy: '🌧️',
}

export function WeatherIconDisplay({ icon, size = 'md' }: { icon: WeatherIcon; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: '1.25rem', md: '1.75rem', lg: '2.5rem' }
  return (
    <span role="img" aria-hidden style={{ fontSize: sizes[size], lineHeight: 1 }}>
      {icons[icon]}
    </span>
  )
}
