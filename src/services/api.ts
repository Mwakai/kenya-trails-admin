const API_URL = import.meta.env.VITE_API_URL

const SERVER_ERROR_FALLBACK = 'Something went wrong. Please try again later.'
const NETWORK_ERROR_FALLBACK = 'Unable to connect to the server. Please check your connection and try again.'

const SENSITIVE_PATTERNS = [
  /SQLSTATE/i,
  /select\s.*\sfrom\s/i,
  /insert\s+into/i,
  /update\s.*\sset/i,
  /delete\s+from/i,
  /Connection:\s*\w+,\s*Host:/i,
  /target machine actively refused/i,
  /stack\s*trace/i,
  /at\s+\S+\s+\(\S+:\d+:\d+\)/,
  /vendor\//i,
  /\.php/i,
  /Exception\s+in/i,
  /PDOException/i,
  /QueryException/i,
]

/**
 * Sanitize error messages so raw server/database errors never reach the UI.
 * - 5xx or network errors always get a generic message.
 * - 4xx messages are passed through only if they don't contain sensitive info.
 */
export function sanitizeErrorMessage(message: string | undefined, status: number): string {
  if (status === 0 || !status) return NETWORK_ERROR_FALLBACK
  if (status >= 500) return SERVER_ERROR_FALLBACK
  if (!message) return SERVER_ERROR_FALLBACK

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) return SERVER_ERROR_FALLBACK
  }

  return message
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = false, headers = {}, ...restOptions } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers as Record<string, string>,
  }

  // Add authorization header if required
  if (requiresAuth) {
    const token = sessionStorage.getItem('token')
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...restOptions,
      headers: requestHeaders,
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_FALLBACK, 0)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new ApiError(
      sanitizeErrorMessage(errorData?.message, response.status),
      response.status,
      errorData,
    )
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
