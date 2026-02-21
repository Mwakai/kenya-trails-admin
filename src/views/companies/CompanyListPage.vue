<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/services/api'
import type { CompanyListItem } from '@/types/company'

const router = useRouter()
const store = useCompaniesStore()
const authStore = useAuthStore()
const toast = useToast()

const searchInput = ref('')
const currentPage = ref(1)
const perPage = ref(15)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Delete modal
const showDeleteModal = ref(false)
const companyToDelete = ref<CompanyListItem | null>(null)
const isDeleting = ref(false)

const canCreate = computed(() => authStore.hasPermission('companies.create'))
const canUpdate = computed(() => authStore.hasPermission('companies.update'))
const canDelete = computed(() => authStore.hasPermission('companies.delete'))

const paginationInfo = computed(() => {
  const m = store.meta
  if (!m) return { start: 0, end: 0, total: 0 }
  const start = (m.current_page - 1) * m.per_page + 1
  const end = Math.min(m.current_page * m.per_page, m.total)
  return { start, end, total: m.total }
})

const pageNumbers = computed(() => {
  const m = store.meta
  if (!m) return []
  const pages: (number | string)[] = []
  const current = m.current_page
  const last = m.last_page
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
  } else if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', last)
  } else if (current >= last - 2) {
    pages.push(1, '...', last - 3, last - 2, last - 1, last)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', last)
  }
  return pages
})

async function loadCompanies() {
  await store.fetchCompanies({
    page: currentPage.value,
    per_page: perPage.value,
    search: searchInput.value || undefined,
  })
}

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadCompanies()
  }, 300)
}

function goToPage(page: number | string) {
  if (typeof page === 'string') return
  if (page < 1 || (store.meta && page > store.meta.last_page)) return
  currentPage.value = page
  loadCompanies()
}

function openDeleteModal(company: CompanyListItem) {
  companyToDelete.value = company
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  companyToDelete.value = null
}

async function handleDelete() {
  if (!companyToDelete.value) return
  isDeleting.value = true
  try {
    await store.deleteCompany(companyToDelete.value.id)
    closeDeleteModal()
    toast.success('Company deleted')
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : 'Failed to delete company')
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadCompanies()
})
</script>

<template>
  <div class="list-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Companies</h1>
        <p>Manage hiking companies and organizers</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" @click="router.push({ name: 'companies-create' })">
        Add Company
      </button>
    </div>

    <!-- Search -->
    <div class="filters-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search companies..."
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-state">
      <div class="spinner" />
      <p>Loading companies...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="error-state">
      <p>{{ store.error }}</p>
      <button class="btn btn-secondary" @click="loadCompanies">Try Again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="store.companies.length === 0" class="empty-state">
      <p>No companies yet.</p>
      <button v-if="canCreate" class="btn btn-primary" @click="router.push({ name: 'companies-create' })">
        Add Company
      </button>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="companies-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Hikes</th>
            <th>Verified</th>
            <th v-if="canUpdate || canDelete">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in store.companies" :key="company.id">
            <td class="company-name-cell">
              <div class="company-logo">
                <img v-if="company.logo_thumbnail" :src="company.logo_thumbnail" :alt="company.name" />
                <div v-else class="logo-placeholder">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7H3l2-4h14l2 4" />
                  </svg>
                </div>
              </div>
              <div>
                <span class="company-name">{{ company.name }}</span>
                <span class="company-slug">/{{ company.slug }}</span>
              </div>
            </td>
            <td>{{ company.hike_count }}</td>
            <td>
              <span v-if="company.is_verified" class="badge-verified">Verified</span>
              <span v-else class="badge-unverified">Unverified</span>
            </td>
            <td v-if="canUpdate || canDelete" class="actions-cell">
              <div class="action-buttons">
                <button
                  v-if="canUpdate"
                  class="btn btn-sm btn-secondary"
                  @click="router.push({ name: 'companies-edit', params: { id: company.id } })"
                >
                  Edit
                </button>
                <button
                  v-if="canDelete"
                  class="btn btn-sm btn-danger"
                  @click="openDeleteModal(company)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="store.meta.total > 0" class="pagination-container">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }}
          </span>
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="store.meta.current_page === 1"
            @click="goToPage(store.meta.current_page - 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <template v-for="(page, index) in pageNumbers" :key="index">
            <span v-if="page === '...'" class="pagination-ellipsis">...</span>
            <button
              v-else
              class="pagination-btn"
              :class="{ active: page === store.meta.current_page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          <button
            class="pagination-btn"
            :disabled="store.meta.current_page === store.meta.last_page"
            @click="goToPage(store.meta.current_page + 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Delete Company</h2>
          <button class="btn-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete <strong>{{ companyToDelete?.name }}</strong>?
            This cannot be undone.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" :disabled="isDeleting" @click="closeDeleteModal">Cancel</button>
          <button class="btn btn-danger" :disabled="isDeleting" @click="handleDelete">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-page {
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

.filters-bar {
  margin-bottom: var(--space-4);
}

.search-box {
  position: relative;
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
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  color: var(--color-error);
}

.error-state p { margin: 0 0 var(--space-4) 0; }

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

.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.companies-table {
  width: 100%;
  border-collapse: collapse;
}

.companies-table th,
.companies-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.companies-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.companies-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.companies-table tbody tr:hover {
  background: var(--color-background-alt);
}

.companies-table tbody tr:last-child td {
  border-bottom: none;
}

.company-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.company-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-background-alt);
}

.company-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

.company-name {
  display: block;
  font-weight: var(--font-weight-medium);
}

.company-slug {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.badge-verified {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: #dcfce7;
  color: #166534;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.badge-unverified {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: #f3f4f6;
  color: #4b5563;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.action-buttons {
  display: flex;
  gap: var(--space-2);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
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

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.pagination-left { display: flex; align-items: center; gap: var(--space-3); }
.pagination-info { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.pagination-controls { display: flex; align-items: center; gap: var(--space-1); }

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
  box-shadow: var(--shadow-lg);
}

.modal-sm { max-width: 400px; }

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

.modal-body p {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
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
</style>
