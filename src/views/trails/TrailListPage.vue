<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTrailsStore } from '@/stores/trails'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'
import type { Trail, TrailFilters, TrailStatus, TrailDifficulty } from '@/types/trail'
import TrailStatusBadge from '@/components/trails/TrailStatusBadge.vue'
import TrailDifficultyBadge from '@/components/trails/TrailDifficultyBadge.vue'
import TrailCard from '@/components/trails/TrailCard.vue'

const router = useRouter()
const trailsStore = useTrailsStore()
const authStore = useAuthStore()

// Permissions
const canCreate = computed(() => authStore.hasPermission('trails.create'))
const canUpdate = computed(() => authStore.hasPermission('trails.update'))
const canDelete = computed(() => authStore.hasPermission('trails.delete'))
const canPublish = computed(() => authStore.hasPermission('trails.publish'))

// View mode
const viewMode = ref<'table' | 'grid'>('table')

// Filter state
const filters = ref<TrailFilters>({
  page: 1,
  per_page: 10,
  search: '',
  status: undefined,
  difficulty: undefined,
  county_slug: undefined,
  with_deleted: false,
})
const searchInput = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Delete modal
const showDeleteModal = ref(false)
const trailToDelete = ref<Trail | null>(null)
const isDeleting = ref(false)

// Actions dropdown
const openActionsId = ref<number | null>(null)

// Computed
const paginationInfo = computed(() => {
  const m = trailsStore.meta
  if (!m) return { start: 0, end: 0, total: 0 }
  const start = (m.current_page - 1) * m.per_page + 1
  const end = Math.min(m.current_page * m.per_page, m.total)
  return { start, end, total: m.total }
})

const pageNumbers = computed(() => {
  const m = trailsStore.meta
  if (!m) return []
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
  return !!(
    filters.value.search ||
    filters.value.status ||
    filters.value.difficulty ||
    filters.value.county_slug ||
    filters.value.with_deleted
  )
})

const popularCounties = computed(() => trailsStore.counties.filter((c) => c.is_popular))
const otherCounties = computed(() => trailsStore.counties.filter((c) => !c.is_popular))

// Methods
async function loadTrails() {
  const activeFilters: TrailFilters = {
    page: filters.value.page,
    per_page: filters.value.per_page,
  }
  if (filters.value.search) activeFilters.search = filters.value.search
  if (filters.value.status) activeFilters.status = filters.value.status
  if (filters.value.difficulty) activeFilters.difficulty = filters.value.difficulty
  if (filters.value.county_slug) activeFilters.county_slug = filters.value.county_slug
  if (filters.value.with_deleted) activeFilters.with_deleted = true

  await trailsStore.fetchTrails(activeFilters)
}

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchInput.value
    filters.value.page = 1
    loadTrails()
  }, 300)
}

function handleFilterChange() {
  filters.value.page = 1
  loadTrails()
}

function goToPage(page: number | string) {
  if (typeof page === 'string') return
  if (page < 1 || page > trailsStore.meta?.last_page) return
  filters.value.page = page
  loadTrails()
}

function clearFilters() {
  searchInput.value = ''
  filters.value = {
    page: 1,
    per_page: 10,
    search: '',
    status: undefined,
    difficulty: undefined,
    county_slug: undefined,
    with_deleted: false,
  }
  loadTrails()
}

function navigateToCreate() {
  router.push({ name: 'trails-create' })
}

function navigateToEdit(trail: Trail) {
  router.push({ name: 'trails-edit', params: { id: trail.id } })
}

function toggleActions(trailId: number) {
  openActionsId.value = openActionsId.value === trailId ? null : trailId
}

function closeActions() {
  openActionsId.value = null
}

function openDeleteModal(trail: Trail) {
  trailToDelete.value = trail
  showDeleteModal.value = true
  closeActions()
}

function closeDeleteModal() {
  showDeleteModal.value = false
  trailToDelete.value = null
}

async function handleDelete() {
  if (!trailToDelete.value) return
  isDeleting.value = true
  try {
    await trailsStore.deleteTrail(trailToDelete.value.id)
    await loadTrails()
    closeDeleteModal()
  } catch (err) {
    if (err instanceof ApiError) {
      alert(err.message)
    } else {
      alert('Failed to delete trail')
    }
  } finally {
    isDeleting.value = false
  }
}

async function handlePublish(trail: Trail) {
  closeActions()
  try {
    await trailsStore.publishTrail(trail.id)
    await loadTrails()
  } catch (err) {
    if (err instanceof ApiError) alert(err.message)
  }
}

async function handleUnpublish(trail: Trail) {
  closeActions()
  try {
    await trailsStore.unpublishTrail(trail.id)
    await loadTrails()
  } catch (err) {
    if (err instanceof ApiError) alert(err.message)
  }
}

function formatDistance(km: number | null): string {
  if (km === null) return '-'
  return `${km} km`
}

function formatDuration(hours: number | null): string {
  if (hours === null) return '-'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours} hr`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function handlePerPageChange() {
  filters.value.page = 1
  loadTrails()
}

onMounted(async () => {
  try {
    await Promise.all([loadTrails(), trailsStore.fetchCounties()])
  } catch {
    // Errors are captured in store state (trailsStore.error)
  }
})
</script>

<template>
  <div class="trails-page" @click="closeActions">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Trails</h1>
        <p>Manage hiking trails and their details</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" @click="navigateToCreate">
        Create Trail
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search trails..."
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.status" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select v-model="filters.difficulty" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="difficult">Difficult</option>
          <option value="expert">Expert</option>
        </select>
        <select v-model="filters.county_slug" class="filter-select" @change="handleFilterChange">
          <option :value="undefined">All Counties</option>
          <optgroup v-if="popularCounties.length" label="Popular">
            <option v-for="county in popularCounties" :key="county.slug" :value="county.slug">
              {{ county.name }}
            </option>
          </optgroup>
          <optgroup v-if="otherCounties.length" label="Other Counties">
            <option v-for="county in otherCounties" :key="county.slug" :value="county.slug">
              {{ county.name }}
            </option>
          </optgroup>
        </select>

        <!-- View Toggle -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'table' }"
            title="Table view"
            @click="viewMode = 'table'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'grid' }"
            title="Grid view"
            @click="viewMode = 'grid'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        <label v-if="authStore.hasPermission('trails.delete')" class="checkbox-label">
          <input
            v-model="filters.with_deleted"
            type="checkbox"
            @change="handleFilterChange"
          />
          Show deleted
        </label>

        <button v-if="hasActiveFilters" class="btn btn-secondary btn-sm" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="trailsStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading trails...</p>
    </div>

    <!-- Error -->
    <div v-else-if="trailsStore.error" class="error-state">
      <p>{{ trailsStore.error }}</p>
      <button class="btn btn-secondary" @click="loadTrails()">Try Again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="trailsStore.trails.length === 0" class="empty-state">
      <p v-if="hasActiveFilters">No trails match your filters. Try adjusting your search.</p>
      <template v-else>
        <p>No trails yet. Create your first trail!</p>
        <button v-if="canCreate" class="btn btn-primary" @click="navigateToCreate">
          Create Trail
        </button>
      </template>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="trails-grid">
      <TrailCard
        v-for="trail in trailsStore.trails"
        :key="trail.id"
        :trail="trail"
        @click="navigateToEdit"
      />
    </div>

    <!-- Table View -->
    <div v-else class="table-container">
      <table class="trails-table">
        <thead>
          <tr>
            <th>Trail</th>
            <th>Location</th>
            <th>Difficulty</th>
            <th>Distance / Duration</th>
            <th>Status</th>
            <th>Created</th>
            <th v-if="canUpdate || canDelete">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trail in trailsStore.trails"
            :key="trail.id"
            :class="{ 'row-deleted': trail.deleted_at }"
          >
            <td class="trail-name-cell">
              <div class="trail-thumb">
                <img
                  v-if="trail.featured_image?.variants?.thumbnail"
                  :src="trail.featured_image.variants.thumbnail"
                  :alt="trail.name"
                />
                <div v-else class="thumb-placeholder">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 3h18v18H3zM8 10l3 3 2-2 4 4" />
                  </svg>
                </div>
              </div>
              <div>
                <span class="trail-name">{{ trail.name }}</span>
                <span class="trail-slug">/trails/{{ trail.slug }}</span>
              </div>
            </td>
            <td>{{ trail.county?.name || '-' }}</td>
            <td>
              <TrailDifficultyBadge v-if="trail.difficulty" :difficulty="trail.difficulty" />
              <span v-else>-</span>
            </td>
            <td>
              {{ formatDistance(trail.distance_km) }} / {{ formatDuration(trail.duration_hours) }}
            </td>
            <td>
              <TrailStatusBadge :status="trail.status" />
            </td>
            <td>{{ formatDate(trail.created_at) }}</td>
            <td v-if="canUpdate || canDelete" class="actions-cell">
              <div class="actions-wrapper">
                <button class="btn-icon" title="Actions" @click.stop="toggleActions(trail.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
                <div v-if="openActionsId === trail.id" class="actions-dropdown" @click.stop>
                  <button v-if="canUpdate" class="dropdown-item" @click="navigateToEdit(trail)">
                    Edit
                  </button>
                  <button
                    v-if="canPublish && trail.status === 'draft'"
                    class="dropdown-item"
                    @click="handlePublish(trail)"
                  >
                    Publish
                  </button>
                  <button
                    v-if="canPublish && trail.status === 'published'"
                    class="dropdown-item"
                    @click="handleUnpublish(trail)"
                  >
                    Unpublish
                  </button>
                  <button
                    v-if="canDelete && !trail.deleted_at"
                    class="dropdown-item dropdown-item-danger"
                    @click="openDeleteModal(trail)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="trailsStore.meta?.total > 0" class="pagination-container">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }} trails
          </span>
          <select v-model="filters.per_page" class="per-page-select" @change="handlePerPageChange">
            <option :value="10">10 per page</option>
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="trailsStore.meta?.current_page === 1"
            @click="goToPage(trailsStore.meta?.current_page - 1)"
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
              :class="{ active: page === trailsStore.meta?.current_page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          <button
            class="pagination-btn"
            :disabled="trailsStore.meta?.current_page === trailsStore.meta?.last_page"
            @click="goToPage(trailsStore.meta?.current_page + 1)"
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
          <h2>Delete Trail</h2>
          <button class="btn-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete <strong>{{ trailToDelete?.name }}</strong>? This action cannot be undone.
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
.trails-page {
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

/* Filters */
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

.view-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  border: none;
  background: var(--color-background);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.toggle-btn:hover:not(.active) {
  background: var(--color-background-alt);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
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

/* States */
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

.error-state p {
  margin: 0 0 var(--space-4) 0;
}

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

/* Grid */
.trails-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

/* Table */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.trails-table {
  width: 100%;
  border-collapse: collapse;
}

.trails-table th,
.trails-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.trails-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trails-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.trails-table tbody tr:hover {
  background: var(--color-background-alt);
}

.trails-table tbody tr:last-child td {
  border-bottom: none;
}

.row-deleted {
  opacity: 0.5;
}

.trail-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.trail-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-background-alt);
}

.trail-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

.trail-name {
  display: block;
  font-weight: var(--font-weight-medium);
}

.trail-slug {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.actions-cell {
  position: relative;
}

.actions-wrapper {
  position: relative;
  display: inline-block;
}

.actions-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  min-width: 140px;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-background-alt);
}

.dropdown-item-danger {
  color: var(--color-error);
}

.dropdown-item-danger:hover {
  background: var(--color-error-bg);
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
  gap: var(--space-3);
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.per-page-select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-background);
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

/* Responsive */
@media (max-width: 1024px) {
  .trails-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .trails-grid {
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
