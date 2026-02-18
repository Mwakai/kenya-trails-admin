<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActivityLogsStore } from '@/stores/activityLogs'
import { useUsersStore } from '@/stores/users'
import type { ActivityLogFilters } from '@/types/activityLog'

const store = useActivityLogsStore()
const usersStore = useUsersStore()

// Filter state
const filters = ref<ActivityLogFilters>({
  page: 1,
  per_page: 20,
  causer_id: undefined,
  log_name: undefined,
  event: undefined,
  date_from: undefined,
  date_to: undefined,
})

// Details expansion
const expandedRows = ref<Set<number>>(new Set())

function toggleRow(id: number) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

// Log name options
const logNameOptions = [
  { value: 'users', label: 'Users' },
  { value: 'trails', label: 'Trails' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'media', label: 'Media' },
  { value: 'auth', label: 'Auth' },
]

// Event options
const eventOptions = [
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'role_changed', label: 'Role Changed' },
  { value: 'activated', label: 'Activated' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'logged_in', label: 'Logged In' },
  { value: 'logged_out', label: 'Logged Out' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'restored', label: 'Restored' },
]

// Computed
const paginationInfo = computed(() => {
  const m = store.meta
  const start = (m.current_page - 1) * m.per_page + 1
  const end = Math.min(m.current_page * m.per_page, m.total)
  return { start, end, total: m.total }
})

const pageNumbers = computed(() => {
  const m = store.meta
  const pages: (number | string)[] = []
  const current = m.current_page
  const last = m.last_page

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

const hasActiveFilters = computed(() => {
  return !!(filters.value.causer_id || filters.value.log_name || filters.value.event || filters.value.date_from || filters.value.date_to)
})

// Methods
async function loadLogs() {
  const activeFilters: ActivityLogFilters = {
    page: filters.value.page,
    per_page: filters.value.per_page,
  }
  if (filters.value.causer_id) activeFilters.causer_id = filters.value.causer_id
  if (filters.value.log_name) activeFilters.log_name = filters.value.log_name
  if (filters.value.event) activeFilters.event = filters.value.event
  if (filters.value.date_from) activeFilters.date_from = filters.value.date_from
  if (filters.value.date_to) activeFilters.date_to = filters.value.date_to

  await store.fetchLogs(activeFilters)
}

function handleFilterChange() {
  filters.value.page = 1
  loadLogs()
}

function goToPage(page: number | string) {
  if (typeof page === 'string') return
  if (page < 1 || page > store.meta.last_page) return
  filters.value.page = page
  loadLogs()
}

function clearFilters() {
  filters.value = {
    page: 1,
    per_page: 20,
    causer_id: undefined,
    log_name: undefined,
    event: undefined,
    date_from: undefined,
    date_to: undefined,
  }
  loadLogs()
}

function getEventClass(event: string): string {
  switch (event) {
    case 'created':
    case 'uploaded':
      return 'event-green'
    case 'updated':
      return 'event-blue'
    case 'deleted':
      return 'event-red'
    case 'status_changed':
    case 'role_changed':
    case 'activated':
    case 'deactivated':
      return 'event-yellow'
    case 'logged_in':
    case 'logged_out':
      return 'event-gray'
    case 'restored':
      return 'event-teal'
    default:
      return 'event-gray'
  }
}

function getSubjectLabel(subjectType: string | null): string {
  if (!subjectType) return '-'
  return subjectType.replace(/^App\\\\Models\\\\/, '').replace(/^App\\Models\\/, '')
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEventLabel(event: string): string {
  return event.replace(/_/g, ' ')
}

function formatProperties(props: Record<string, unknown> | null): string {
  if (!props) return ''
  return JSON.stringify(props, null, 2)
}

function getSubjectRoute(subjectType: string | null, subjectId: number | null): string | null {
  if (!subjectType || !subjectId) return null
  const model = subjectType.replace(/^App\\\\Models\\\\/, '').replace(/^App\\Models\\/, '')
  switch (model) {
    case 'Trail':
      return `/trails/${subjectId}/edit`
    case 'User':
      return `/users`
    case 'Amenity':
      return `/amenities`
    case 'Media':
      return `/media`
    default:
      return null
  }
}

onMounted(() => {
  store.ensureLogs({ per_page: 20 })
  usersStore.ensureUsers({ per_page: 100 })
})
</script>

<template>
  <div class="activity-log-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Activity Log</h1>
        <p>Audit trail of all user actions</p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <select v-model="filters.causer_id" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Users</option>
          <option v-for="user in usersStore.users" :key="user.id" :value="user.id">
            {{ user.full_name }}
          </option>
        </select>
        <select v-model="filters.log_name" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Modules</option>
          <option v-for="opt in logNameOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filters.event" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Events</option>
          <option v-for="opt in eventOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input
          v-model="filters.date_from"
          type="date"
          class="filter-input"
          placeholder="From"
          @change="handleFilterChange"
        />
        <input
          v-model="filters.date_to"
          type="date"
          class="filter-input"
          placeholder="To"
          @change="handleFilterChange"
        />
        <button v-if="hasActiveFilters" class="btn btn-secondary btn-sm" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading activity logs...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="error-state">
      <p>{{ store.error }}</p>
      <button class="btn btn-secondary" @click="loadLogs()">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="store.logs.length === 0" class="empty-state">
      <p>No activity logs found</p>
    </div>

    <!-- Logs Table -->
    <div v-else class="table-container">
      <table class="logs-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Activity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="log in store.logs" :key="log.id">
            <tr>
              <td>
                <div class="user-cell">
                  <span class="user-name">
                    <template v-if="log.causer">{{ log.causer.full_name }}</template>
                    <template v-else-if="log.causer_id">Causer #{{ log.causer_id }}</template>
                    <span v-else class="text-muted">System</span>
                  </span>
                  <span class="user-time">{{ formatDate(log.created_at) }}</span>
                </div>
              </td>
              <td>
                <div class="activity-cell">
                  <span class="event-badge" :class="getEventClass(log.event)">
                    {{ formatEventLabel(log.event) }}
                  </span>
                  <template v-if="log.subject_type">
                    <router-link
                      v-if="getSubjectRoute(log.subject_type, log.subject_id)"
                      :to="getSubjectRoute(log.subject_type, log.subject_id)!"
                      class="subject-link"
                    >
                      {{ getSubjectLabel(log.subject_type) }} #{{ log.subject_id }}
                    </router-link>
                    <span v-else class="subject-text">{{ getSubjectLabel(log.subject_type) }} #{{ log.subject_id }}</span>
                  </template>
                </div>
              </td>
              <td>
                <button
                  v-if="log.properties && Object.keys(log.properties).length > 0"
                  class="btn-details"
                  @click="toggleRow(log.id)"
                >
                  {{ expandedRows.has(log.id) ? 'Hide' : 'View' }}
                </button>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
            <tr v-if="expandedRows.has(log.id) && log.properties" class="details-row">
              <td colspan="3">
                <pre class="properties-json">{{ formatProperties(log.properties) }}</pre>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="store.meta.total > 0" class="pagination-container">
        <div class="pagination-left">
          <div class="pagination-info">
            Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of
            {{ paginationInfo.total }} entries
          </div>
          <div class="per-page-selector">
            <label for="per-page">Per page:</label>
            <select id="per-page" v-model="filters.per_page" class="per-page-select" @change="handleFilterChange">
              <option :value="10">10</option>
              <option :value="15">15</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
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
  </div>
</template>

<style scoped>
.activity-log-page {
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

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.filter-select,
.filter-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  cursor: pointer;
  min-width: 120px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-input {
  cursor: text;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-details {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-details:hover {
  background: var(--color-primary-light);
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
  margin: 0;
}

/* Table */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th,
.logs-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.logs-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.logs-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.logs-table tbody tr:last-child td {
  border-bottom: none;
}

/* User Cell */
.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: var(--font-weight-medium);
}

.user-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Activity Cell */
.activity-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.subject-text {
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-secondary);
}

/* Event Badges */
.event-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.event-green {
  background: #dcfce7;
  color: #166534;
}

.event-blue {
  background: #dbeafe;
  color: #1e40af;
}

.event-red {
  background: #fee2e2;
  color: #991b1b;
}

.event-yellow {
  background: #fef3c7;
  color: #92400e;
}

.event-gray {
  background: #f3f4f6;
  color: #374151;
}

.event-teal {
  background: #ccfbf1;
  color: #115e59;
}

/* Details Row */
.details-row td {
  padding: 0 var(--space-4) var(--space-3) var(--space-4);
  background: var(--color-background-alt);
}

.properties-json {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Subject Link */
.subject-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.subject-link:hover {
  text-decoration: underline;
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

.pagination-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.per-page-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  cursor: pointer;
}

.per-page-select:focus {
  outline: none;
  border-color: var(--color-primary);
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

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .filter-select,
  .filter-input {
    flex: 1;
    min-width: 0;
  }

  .pagination-container {
    flex-direction: column;
    text-align: center;
  }

  .pagination-left {
    flex-direction: column;
    gap: var(--space-2);
  }

  .logs-table {
    font-size: var(--font-size-xs);
  }
}
</style>
