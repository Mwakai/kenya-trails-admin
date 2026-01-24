<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'
import type { User, CreateUserPayload, UpdateUserPayload, UserFilters } from '@/types/auth'

const usersStore = useUsersStore()
const authStore = useAuthStore()

// Filter state
const filters = ref<UserFilters>({
  page: 1,
  per_page: 15,
  search: '',
  role_id: undefined,
  status: undefined,
  company_id: undefined,
})
const searchInput = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingUser = ref<User | null>(null)

// Delete confirmation state
const showDeleteModal = ref(false)
const userToDelete = ref<User | null>(null)
const isDeleting = ref(false)

// Form state
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role_id: 0,
  company_id: null as number | null,
  phone: '',
  status: 'active' as 'active' | 'inactive',
})
const formError = ref('')
const formErrors = ref<Record<string, string[]>>({})
const isSubmitting = ref(false)

// Computed
const canCreate = computed(() => authStore.hasPermission('users.create'))
const canUpdate = computed(() => authStore.hasPermission('users.update'))
const canDelete = computed(() => authStore.hasPermission('users.delete'))

const modalTitle = computed(() => (modalMode.value === 'create' ? 'Create User' : 'Edit User'))

const paginationInfo = computed(() => {
  const meta = usersStore.meta
  const start = (meta.current_page - 1) * meta.per_page + 1
  const end = Math.min(meta.current_page * meta.per_page, meta.total)
  return { start, end, total: meta.total }
})

const pageNumbers = computed(() => {
  const meta = usersStore.meta
  const pages: (number | string)[] = []
  const current = meta.current_page
  const last = meta.last_page

  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', last)
    } else if (current >= last - 2) {
      pages.push(1, '...', last - 3, last - 2, last - 1, last)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', last)
    }
  }
  return pages
})

// Methods
async function loadUsers() {
  const activeFilters: UserFilters = {
    page: filters.value.page,
    per_page: filters.value.per_page,
  }
  if (filters.value.search) activeFilters.search = filters.value.search
  if (filters.value.role_id) activeFilters.role_id = filters.value.role_id
  if (filters.value.status) activeFilters.status = filters.value.status
  if (filters.value.company_id) activeFilters.company_id = filters.value.company_id

  await usersStore.fetchUsers(activeFilters)
}

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchInput.value
    filters.value.page = 1
    loadUsers()
  }, 300)
}

function handleFilterChange() {
  filters.value.page = 1
  loadUsers()
}

function goToPage(page: number | string) {
  if (typeof page === 'string') return
  if (page < 1 || page > usersStore.meta.last_page) return
  filters.value.page = page
  loadUsers()
}

function clearFilters() {
  searchInput.value = ''
  filters.value = {
    page: 1,
    per_page: 15,
    search: '',
    role_id: undefined,
    status: undefined,
    company_id: undefined,
  }
  loadUsers()
}

const hasActiveFilters = computed(() => {
  return !!(
    filters.value.search ||
    filters.value.role_id ||
    filters.value.status ||
    filters.value.company_id
  )
})
function openCreateModal() {
  modalMode.value = 'create'
  editingUser.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(user: User) {
  modalMode.value = 'edit'
  editingUser.value = user
  formData.value = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: '',
    password_confirmation: '',
    role_id: user.role.id,
    company_id: user.company?.id ?? null,
    phone: user.phone ?? '',
    status: user.status,
  }
  formError.value = ''
  formErrors.value = {}
  showModal.value = true
}

function openDeleteModal(user: User) {
  userToDelete.value = user
  showDeleteModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
  resetForm()
}

function closeDeleteModal() {
  showDeleteModal.value = false
  userToDelete.value = null
}

function resetForm() {
  formData.value = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: usersStore.roles[0]?.id ?? 0,
    company_id: null,
    phone: '',
    status: 'active',
  }
  formError.value = ''
  formErrors.value = {}
}

function getFieldError(field: string): string {
  return formErrors.value[field]?.[0] ?? ''
}

async function handleSubmit() {
  formError.value = ''
  formErrors.value = {}
  isSubmitting.value = true

  try {
    if (modalMode.value === 'create') {
      const payload: CreateUserPayload = {
        first_name: formData.value.first_name,
        last_name: formData.value.last_name,
        email: formData.value.email,
        password: formData.value.password,
        password_confirmation: formData.value.password_confirmation,
        role_id: formData.value.role_id,
        status: formData.value.status,
      }
      if (formData.value.company_id) {
        payload.company_id = formData.value.company_id
      }
      if (formData.value.phone) {
        payload.phone = formData.value.phone
      }
      await usersStore.createUser(payload)
      await loadUsers()
    } else if (editingUser.value) {
      const payload: UpdateUserPayload = {
        first_name: formData.value.first_name,
        last_name: formData.value.last_name,
        email: formData.value.email,
        role_id: formData.value.role_id,
        company_id: formData.value.company_id,
        phone: formData.value.phone || undefined,
        status: formData.value.status,
      }
      if (formData.value.password) {
        payload.password = formData.value.password
        payload.password_confirmation = formData.value.password_confirmation
      }
      await usersStore.updateUser(editingUser.value.id, payload)
      await loadUsers()
    }
    closeModal()
  } catch (err) {
    if (err instanceof ApiError) {
      formError.value = err.message
      if (err.data && typeof err.data === 'object' && 'errors' in err.data) {
        formErrors.value = (err.data as { errors: Record<string, string[]> }).errors
      }
    } else {
      formError.value = 'An unexpected error occurred'
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!userToDelete.value) return

  isDeleting.value = true
  try {
    await usersStore.deleteUser(userToDelete.value.id)
    await loadUsers()
    closeDeleteModal()
  } catch (err) {
    if (err instanceof ApiError) {
      alert(err.message)
    } else {
      alert('Failed to delete user')
    }
  } finally {
    isDeleting.value = false
  }
}

function getStatusClass(status: string): string {
  return status === 'active' ? 'status-active' : 'status-inactive'
}

onMounted(async () => {
  await Promise.all([loadUsers(), usersStore.fetchRoles(), usersStore.fetchCompanies()])
})
</script>

<template>
  <div class="users-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Users</h1>
        <p>Manage user accounts and permissions</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" @click="openCreateModal">Add User</button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="search-box">
        <svg
          class="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search by name or email..."
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.role_id" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Roles</option>
          <option v-for="role in usersStore.roles" :key="role.id" :value="role.id">
            {{ role.name }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select v-model="filters.company_id" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Companies</option>
          <option v-for="company in usersStore.companies" :key="company.id" :value="company.id">
            {{ company.name }}
          </option>
        </select>
        <button v-if="hasActiveFilters" class="btn btn-secondary btn-sm" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="usersStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="usersStore.error" class="error-state">
      <p>{{ usersStore.error }}</p>
      <button class="btn btn-secondary" @click="loadUsers()">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="usersStore.users.length === 0" class="empty-state">
      <p>No users found</p>
      <button v-if="canCreate" class="btn btn-primary" @click="openCreateModal">
        Create your first user
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Company</th>
            <th>Status</th>
            <th v-if="canUpdate || canDelete">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersStore.users" :key="user.id">
            <td class="user-name">
              <div class="user-avatar">{{ user.first_name[0] }}{{ user.last_name[0] }}</div>
              <span>{{ user.first_name }} {{ user.last_name }}</span>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.phone || '-' }}</td>
            <td>
              <span class="role-badge">{{ user.role.name }}</span>
            </td>
            <td>{{ user.company?.name || '-' }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(user.status)">
                {{ user.status }}
              </span>
            </td>
            <td v-if="canUpdate || canDelete" class="actions-cell">
              <button v-if="canUpdate" class="btn-icon" title="Edit" @click="openEditModal(user)">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                v-if="canDelete"
                class="btn-icon btn-icon-danger"
                title="Delete"
                @click="openDeleteModal(user)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="usersStore.meta.total > 0" class="pagination-container">
        <div class="pagination-info">
          Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of
          {{ paginationInfo.total }} users
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="usersStore.meta.current_page === 1"
            @click="goToPage(usersStore.meta.current_page - 1)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <template v-for="(page, index) in pageNumbers" :key="index">
            <span v-if="page === '...'" class="pagination-ellipsis">...</span>
            <button
              v-else
              class="pagination-btn"
              :class="{ active: page === usersStore.meta.current_page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          <button
            class="pagination-btn"
            :disabled="usersStore.meta.current_page === usersStore.meta.last_page"
            @click="goToPage(usersStore.meta.current_page + 1)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div v-if="formError" class="form-error">{{ formError }}</div>

            <div class="form-row">
              <div class="form-group">
                <label for="first_name">First Name *</label>
                <input
                  id="first_name"
                  v-model="formData.first_name"
                  type="text"
                  required
                  :class="{ 'input-error': getFieldError('first_name') }"
                  :disabled="isSubmitting"
                />
                <span v-if="getFieldError('first_name')" class="field-error">
                  {{ getFieldError('first_name') }}
                </span>
              </div>
              <div class="form-group">
                <label for="last_name">Last Name *</label>
                <input
                  id="last_name"
                  v-model="formData.last_name"
                  type="text"
                  required
                  :class="{ 'input-error': getFieldError('last_name') }"
                  :disabled="isSubmitting"
                />
                <span v-if="getFieldError('last_name')" class="field-error">
                  {{ getFieldError('last_name') }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                :class="{ 'input-error': getFieldError('email') }"
                :disabled="isSubmitting"
              />
              <span v-if="getFieldError('email')" class="field-error">
                {{ getFieldError('email') }}
              </span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="password">
                  Password {{ modalMode === 'create' ? '*' : '(leave blank to keep current)' }}
                </label>
                <input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  :required="modalMode === 'create'"
                  :class="{ 'input-error': getFieldError('password') }"
                  :disabled="isSubmitting"
                />
                <span v-if="getFieldError('password')" class="field-error">
                  {{ getFieldError('password') }}
                </span>
              </div>
              <div class="form-group">
                <label for="password_confirmation">Confirm Password</label>
                <input
                  id="password_confirmation"
                  v-model="formData.password_confirmation"
                  type="password"
                  :required="modalMode === 'create' || !!formData.password"
                  :class="{ 'input-error': getFieldError('password_confirmation') }"
                  :disabled="isSubmitting"
                />
                <span v-if="getFieldError('password_confirmation')" class="field-error">
                  {{ getFieldError('password_confirmation') }}
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="role_id">Role *</label>
                <select
                  id="role_id"
                  v-model="formData.role_id"
                  required
                  :class="{ 'input-error': getFieldError('role_id') }"
                  :disabled="isSubmitting"
                >
                  <option :value="0" disabled>Select a role</option>
                  <option v-for="role in usersStore.roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <span v-if="getFieldError('role_id')" class="field-error">
                  {{ getFieldError('role_id') }}
                </span>
              </div>
              <div class="form-group">
                <label for="company_id">Company</label>
                <select
                  id="company_id"
                  v-model="formData.company_id"
                  :class="{ 'input-error': getFieldError('company_id') }"
                  :disabled="isSubmitting"
                >
                  <option :value="null">No company</option>
                  <option
                    v-for="company in usersStore.companies"
                    :key="company.id"
                    :value="company.id"
                  >
                    {{ company.name }}
                  </option>
                </select>
                <span v-if="getFieldError('company_id')" class="field-error">
                  {{ getFieldError('company_id') }}
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone">Phone</label>
                <input
                  id="phone"
                  v-model="formData.phone"
                  type="tel"
                  :class="{ 'input-error': getFieldError('phone') }"
                  :disabled="isSubmitting"
                />
                <span v-if="getFieldError('phone')" class="field-error">
                  {{ getFieldError('phone') }}
                </span>
              </div>
              <div class="form-group">
                <label for="status">Status</label>
                <select
                  id="status"
                  v-model="formData.status"
                  :class="{ 'input-error': getFieldError('status') }"
                  :disabled="isSubmitting"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <span v-if="getFieldError('status')" class="field-error">
                  {{ getFieldError('status') }}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{
                isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Save Changes'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Delete User</h2>
          <button class="btn-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete
            <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong
            >? This action cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" :disabled="isDeleting" @click="closeDeleteModal">
            Cancel
          </button>
          <button class="btn btn-danger" :disabled="isDeleting" @click="handleDelete">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-page {
  padding: var(--space-6);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.header-content h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.header-content p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-10);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  cursor: pointer;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Buttons */
.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-alt);
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.btn-icon-danger:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.btn-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: var(--color-text-primary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-4);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  color: var(--color-error);
}

.error-state p {
  margin: 0 0 var(--space-4) 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-16);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4) 0;
}

/* Table */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.users-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.users-table tbody tr:hover {
  background: var(--color-background-alt);
}

.users-table tbody tr:last-child td {
  border-bottom: none;
}

.user-name {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.role-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.actions-cell {
  display: flex;
  gap: var(--space-1);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-background-alt);
  border-color: var(--color-primary);
}

.pagination-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-ellipsis {
  padding: 0 var(--space-2);
  color: var(--color-text-secondary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* Form */
.form-error {
  padding: var(--space-3);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-group input,
.form-group select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.form-group input:disabled,
.form-group select:disabled {
  background: var(--color-background-alt);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error) !important;
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .filter-select {
    flex: 1;
    min-width: 0;
  }

  .pagination-container {
    flex-direction: column;
    text-align: center;
  }
}
</style>
