const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export function isBackendConfigured(): boolean {
  return API_BASE.length > 0
}

export function getApiBaseUrl(): string {
  return API_BASE
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError('Backend URL is not configured (VITE_API_URL).', 0)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
