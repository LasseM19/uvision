/** Parse Open-Meteo local datetime (no offset) to a UTC instant in the given IANA zone. */
export function parseLocalDateTime(isoLocal: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoLocal)
  if (!match) return new Date(isoLocal)

  const want = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  function readLocalParts(ms: number) {
    const parts: Record<string, number> = {}
    formatter.formatToParts(new Date(ms)).forEach(({ type, value }) => {
      if (type !== 'literal') parts[type] = Number(value)
    })
    return parts
  }

  let ms = Date.UTC(want.year, want.month - 1, want.day, want.hour, want.minute)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const parts = readLocalParts(ms)
    if (
      parts.year === want.year &&
      parts.month === want.month &&
      parts.day === want.day &&
      parts.hour === want.hour &&
      parts.minute === want.minute
    ) {
      return new Date(ms)
    }

    const got = Date.UTC(
      parts.year ?? want.year,
      (parts.month ?? want.month) - 1,
      parts.day ?? want.day,
      parts.hour ?? 0,
      parts.minute ?? 0,
    )
    const target = Date.UTC(want.year, want.month - 1, want.day, want.hour, want.minute)
    ms += target - got
  }

  return new Date(ms)
}

export function getTodayKeyInZone(timeZone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)
}

export function formatTimeInZone(date: Date, timeZone: string): string {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
}

export function formatDateInZone(date: Date, timeZone: string): string {
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}

export function isSameHourInZone(a: Date, b: Date, timeZone: string): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  return formatter.format(a) === formatter.format(b)
}

export function resolveLocationTimezone(
  forecastTimezone?: string | null,
  fallback = 'UTC',
): string {
  return forecastTimezone?.trim() || fallback
}
