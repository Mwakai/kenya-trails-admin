import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, LoginResponse } from '@/types/auth'

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  PERMISSIONS: 'permissions',
} as const

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))

  const getUserFromStorage = (): User | null => {
    const userString = localStorage.getItem(STORAGE_KEYS.USER)
    if (!userString || userString === 'undefined' || userString === 'null') return null
    try {
      return JSON.parse(userString)
    } catch {
      return null
    }
  }

  const getPermissionsFromStorage = (): string[] => {
    const permissionsString = localStorage.getItem(STORAGE_KEYS.PERMISSIONS)
    if (!permissionsString) return []
    try {
      return JSON.parse(permissionsString)
    } catch {
      return []
    }
  }

  const user = ref<User | null>(getUserFromStorage())
  const permissions = ref<string[]>(getPermissionsFromStorage())

  const isAuthenticated = computed(() => !!token.value)

  const userInitials = computed(() => {
    if (!user.value) return '?'
    const { first_name, last_name, full_name } = user.value
    if (first_name && last_name) {
      return `${first_name[0]}${last_name[0]}`.toUpperCase()
    }
    if (full_name) {
      const names = full_name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return full_name.substring(0, 2).toUpperCase()
    }
    return '?'
  })

  const userRole = computed(() => user.value?.role?.name ?? 'Unknown')

  const userName = computed(() => user.value?.full_name ?? 'User')

  function hasPermission(permission: string): boolean {
    const [resource, action] = permission.split('.')
    return (
      permissions.value.includes(permission) ||
      permissions.value.includes(`${resource}.*`)
    )
  }

  function hasAnyPermission(permissionList: string[]): boolean {
    if (permissionList.length === 0) return true
    return permissionList.some((p) => hasPermission(p))
  }

  function hasAllPermissions(permissionList: string[]): boolean {
    return permissionList.every((p) => hasPermission(p))
  }

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

    token.value = data.data.token
    user.value = data.data.user
    permissions.value = data.data.user.role.permissions

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user))
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(data.data.user.role.permissions))
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
      clearAuth()
    }
  }

  function clearAuth(): void {
    token.value = null
    user.value = null
    permissions.value = []
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.PERMISSIONS)
  }

  function getToken(): string | null {
    return token.value
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    userInitials,
    userRole,
    userName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    clearAuth,
    getToken,
  }
})
