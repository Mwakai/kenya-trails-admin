import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/services/api'
import type {
  User,
  UserListResponse,
  UserResponse,
  UserDeleteResponse,
  CreateUserPayload,
  UpdateUserPayload,
  RoleOption,
  RolesResponse,
  CompanyOption,
  CompaniesResponse,
  PaginationMeta,
  UserFilters,
} from '@/types/auth'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const roles = ref<RoleOption[]>([])
  const companies = ref<CompanyOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  async function fetchUsers(filters: UserFilters = {}): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.per_page) params.append('per_page', String(filters.per_page))
      if (filters.search) params.append('search', filters.search)
      if (filters.role_id) params.append('role_id', String(filters.role_id))
      if (filters.status) params.append('status', filters.status)
      if (filters.company_id) params.append('company_id', String(filters.company_id))

      const queryString = params.toString()
      const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users'

      const response = await api.get<UserListResponse>(endpoint, {
        requiresAuth: true,
      })
      users.value = response.data.users
      meta.value = response.meta
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: number): Promise<User> {
    const response = await api.get<UserResponse>(`/admin/users/${id}`, {
      requiresAuth: true,
    })
    return response.data.user
  }

  async function createUser(payload: CreateUserPayload): Promise<User> {
    const response = await api.post<UserResponse>('/admin/users', payload, {
      requiresAuth: true,
    })
    users.value.push(response.data.user)
    return response.data.user
  }

  async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const response = await api.patch<UserResponse>(`/admin/users/${id}`, payload, {
      requiresAuth: true,
    })
    const index = users.value.findIndex((u) => u.id === id)
    if (index !== -1) {
      users.value[index] = response.data.user
    }
    return response.data.user
  }

  async function deleteUser(id: number): Promise<void> {
    await api.delete<UserDeleteResponse>(`/admin/users/${id}`, {
      requiresAuth: true,
    })
    users.value = users.value.filter((u) => u.id !== id)
  }

  async function fetchRoles(): Promise<void> {
    try {
      const response = await api.get<RolesResponse>('/admin/roles', {
        requiresAuth: true,
      })
      roles.value = response.data.roles
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  async function fetchCompanies(): Promise<void> {
    try {
      const response = await api.get<CompaniesResponse>('/admin/companies', {
        requiresAuth: true,
      })
      companies.value = response.data.companies
    } catch (err) {
      console.error('Failed to load companies:', err)
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    users,
    roles,
    companies,
    loading,
    error,
    meta,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    fetchCompanies,
    clearError,
  }
})
