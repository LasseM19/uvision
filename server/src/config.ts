export function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export function getOptionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export function getCorsOrigins(): string[] {
  return getOptionalEnv('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getPort(): number {
  return Number(getOptionalEnv('PORT', '3001'))
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  )
}
