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

const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

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

  // Cache tracking
  const _initialized = ref(false)
  const _rolesInitialized = ref(false)
  const _companiesInitialized = ref(false)
  const _lastFetchedAt = ref(0)

  // In-flight deduplication
  let _usersPromise: Promise<void> | null = null
  let _rolesPromise: Promise<void> | null = null
  let _companiesPromise: Promise<void> | null = null

  async function fetchUsers(filters: UserFilters = {}, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
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
      if (response.meta) {
        meta.value = response.meta
      }
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load users'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureUsers(filters: UserFilters = {}): Promise<void> {
    if (_initialized.value && users.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchUsers(filters, { silent: true }).catch(() => {})
      }
      return
    }
    if (_usersPromise) return _usersPromise
    _usersPromise = fetchUsers(filters).finally(() => { _usersPromise = null })
    return _usersPromise
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
      roles.value = response.data?.roles ?? []
      _rolesInitialized.value = true
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  async function ensureRoles(): Promise<void> {
    if (_rolesInitialized.value && roles.value.length > 0) return
    if (_rolesPromise) return _rolesPromise
    _rolesPromise = fetchRoles().finally(() => { _rolesPromise = null })
    return _rolesPromise
  }

  async function fetchCompanies(): Promise<void> {
    try {
      const response = await api.get<CompaniesResponse>('/admin/companies', {
        requiresAuth: true,
      })
      companies.value = response.data?.companies ?? []
      _companiesInitialized.value = true
    } catch (err) {
      console.error('Failed to load companies:', err)
    }
  }

  async function ensureCompanies(): Promise<void> {
    if (_companiesInitialized.value && companies.value.length > 0) return
    if (_companiesPromise) return _companiesPromise
    _companiesPromise = fetchCompanies().finally(() => { _companiesPromise = null })
    return _companiesPromise
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    users.value = []
    roles.value = []
    companies.value = []
    loading.value = false
    error.value = null
    meta.value = { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    _initialized.value = false
    _rolesInitialized.value = false
    _companiesInitialized.value = false
    _lastFetchedAt.value = 0
    _usersPromise = null
    _rolesPromise = null
    _companiesPromise = null
  }

  return {
    users,
    roles,
    companies,
    loading,
    error,
    meta,
    fetchUsers,
    ensureUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    ensureRoles,
    fetchCompanies,
    ensureCompanies,
    clearError,
    $reset,
  }
})
