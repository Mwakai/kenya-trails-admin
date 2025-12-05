import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface User {
  name: string
  email: string
}

interface LoginResponse {
  data: {
    token: string
  }
  message: string
  status: number
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const getUserFromStorage = (): User | null => {
    const userString = localStorage.getItem('user')
    if (!userString || userString === 'undefined' || userString === 'null') return null
    try {
      return JSON.parse(userString)
    } catch {
      return null
    }
  }

  const user = ref<User | null>(getUserFromStorage())

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL

    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    const data: LoginResponse = await response.json()

    // Store token
    token.value = data.data.token

    // Persist to localStorage
    localStorage.setItem('token', data.data.token)

    // TODO: Fetch user data from a separate endpoint if needed
    // For now, user will remain null until we have a user endpoint
  }

  async function logout(): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      if (token.value) {
        await fetch(`${apiUrl}/admin/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token.value}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  function getToken(): string | null {
    return token.value
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    getToken,
  }
})
