function effectiveUv(rawUv: number, cloudCoverPercent: number): number {
  const cloudFraction = Math.min(100, Math.max(0, cloudCoverPercent)) / 100
  return Math.round(rawUv * (1 - cloudFraction * 0.65) * 10) / 10
}

export async function fetchMaxEffectiveUvToday(
  latitude: number,
  longitude: number,
): Promise<number> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'uv_index_max,cloud_cover_mean',
    timezone: 'auto',
    forecast_days: '1',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error('Open-Meteo request failed')

  const data = (await response.json()) as {
    daily?: {
      uv_index_max?: number[]
      cloud_cover_mean?: number[]
    }
  }

  const maxUv = data.daily?.uv_index_max?.[0] ?? 0
  const cloudCover = data.daily?.cloud_cover_mean?.[0] ?? 0
  return effectiveUv(maxUv, cloudCover)
}

export function morningAlertCopy(maxUv: number): { title: string; body: string } | null {
  if (maxUv < 3) return null

  if (maxUv >= 6) {
    return {
      title: 'High UV today',
      body: `Max UV is ${maxUv} today. Take sunscreen if you'll be outside.`,
    }
  }

  return {
    title: 'UV check',
    body: `Max UV is ${maxUv} today. Consider sunscreen if you'll be outside for a while.`,
  }
}
