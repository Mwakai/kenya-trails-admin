import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface User {
  name: string
  email: string
}

interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL

    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    const data: LoginResponse = await response.json()

    // Store token and user data
    token.value = data.access_token
    user.value = data.user

    // Persist to localStorage
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
