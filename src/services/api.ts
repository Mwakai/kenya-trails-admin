const API_URL = import.meta.env.VITE_API_URL

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers: requestHeaders,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new ApiError(
      errorData?.message || `Request failed with status ${response.status}`,
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
