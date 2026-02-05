import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import type { User, LoginResponse } from '@/types/auth'
import { sanitizeErrorMessage } from '@/services/api'

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  PERMISSIONS: 'permissions',
} as const

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const token = ref<string | null>(sessionStorage.getItem(STORAGE_KEYS.TOKEN))

  const getUserFromStorage = (): User | null => {
    const userString = sessionStorage.getItem(STORAGE_KEYS.USER)
    if (!userString || userString === 'undefined' || userString === 'null') return null
    try {
      return JSON.parse(userString)
    } catch {
      return null
    }
  }

  const getPermissionsFromStorage = (): string[] => {
    const permissionsString = sessionStorage.getItem(STORAGE_KEYS.PERMISSIONS)
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
      const names = full_name.split(' ').filter(Boolean)
      if (names.length >= 2 && names[0] && names[1]) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return full_name.substring(0, 2).toUpperCase()
    }
    return '?'
  })

  const userRole = computed(() => user.value?.role?.name ?? 'Unknown')

  const userName = computed(() => user.value?.full_name ?? 'User')

  const isSuperAdmin = computed(() => user.value?.role?.slug === 'super_admin')

  function hasPermission(permission: string): boolean {
    if (isSuperAdmin.value) return true
    const [resource] = permission.split('.')
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

    let response: Response
    try {
      response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error('Unable to connect to the server. Please check your connection and try again.')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(sanitizeErrorMessage(error.message, response.status) || 'Login failed')
    }

    const data: LoginResponse = await response.json()

    token.value = data.data.token
    user.value = data.data.user
    permissions.value = data.data.user.role.permissions

    sessionStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token)
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user))
    sessionStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(data.data.user.role.permissions))
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
      router.push({ name: 'login' })
    }
  }

  function clearAuth(): void {
    token.value = null
    user.value = null
    permissions.value = []
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
    sessionStorage.removeItem(STORAGE_KEYS.USER)
    sessionStorage.removeItem(STORAGE_KEYS.PERMISSIONS)
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
