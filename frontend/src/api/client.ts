export type RequestOptions = { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal }
export type ApiClient = <T = unknown>(path: string, options?: RequestOptions) => Promise<T>
export type SessionProps = { token: string; api: ApiClient; log: (message: string) => void }

export function createApiClient(token: string, onUnauthorized: () => void): ApiClient {
  return async function request<T>(path: string, options?: RequestOptions): Promise<T> {
    const authenticated = options?.auth !== false && !!token
    const response = await fetch(path, {
      method: options?.method ?? 'GET',
      headers: {
        ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    })
    if (!response.ok) {
      // An unsuccessful public login must not log out an existing session.
      if (response.status === 401 && authenticated) onUnauthorized()
      throw new Error(await extractError(response))
    }
    if (response.status === 204) return null as T
    const contentType = response.headers.get('content-type') ?? ''
    return contentType.includes('json') ? await response.json() as T : await response.text() as T
  }
}

async function extractError(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`
  const text = await response.text()
  if (!(response.headers.get('content-type') ?? '').includes('json')) return text || fallback
  try {
    const payload = JSON.parse(text)
    return payload.message || payload.detail || fallback
  } catch {
    return fallback
  }
}
