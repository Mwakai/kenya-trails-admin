<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupHikesStore } from '@/stores/groupHikes'
import { useAuthStore } from '@/stores/auth'
import { useGroupHikeFilters } from '@/composables/useGroupHikeFilters'
import { useGroupHikeActions } from '@/composables/useGroupHikeActions'
import { useTrailsStore } from '@/stores/trails'
import type { GroupHikeListItem } from '@/types/groupHike'
import GroupHikeTable from '@/components/group-hikes/GroupHikeTable.vue'
import GroupHikeCard from '@/components/group-hikes/GroupHikeCard.vue'
import GroupHikeStatusBadge from '@/components/group-hikes/GroupHikeStatusBadge.vue'
import CancelModal from '@/components/group-hikes/modals/CancelModal.vue'
import DeleteConfirmModal from '@/components/group-hikes/modals/DeleteConfirmModal.vue'

const router = useRouter()
const store = useGroupHikesStore()
const authStore = useAuthStore()
const trailsStore = useTrailsStore()
const actions = useGroupHikeActions()

const {
  filters,
  searchInput,
  hasActiveFilters,
  handleSearchInput,
  handleFilterChange,
  setStatusFilter,
  clearFilters,
  goToPage,
  handlePerPageChange,
} = useGroupHikeFilters()

// Permissions
const canCreate = computed(() => authStore.hasAnyPermission(['group_hikes.create']))
const canPublish = computed(() => authStore.hasAnyPermission(['group_hikes.publish']))
const canViewAll = computed(() => authStore.hasAnyPermission(['group_hikes.view_all']))

// View mode
const viewMode = ref<'table' | 'grid'>('table')

// Active tab
type Tab = 'upcoming' | 'past' | 'drafts' | 'cancelled' | 'all'
const activeTab = ref<Tab>('upcoming')

// Modals
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const hikeForAction = ref<GroupHikeListItem | null>(null)

// Pagination
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

// Methods
async function loadHikes() {
  await store.fetchGroupHikes({
    ...filters.value,
    status: filters.value.status || undefined,
    organizer_id: filters.value.organizer_id || undefined,
    company_id: filters.value.company_id || undefined,
    region_id: filters.value.region_id || undefined,
    date_from: filters.value.date_from || undefined,
    date_to: filters.value.date_to || undefined,
    search: filters.value.search || undefined,
  } as any)
}

function switchTab(tab: Tab) {
  activeTab.value = tab
  // Apply tab-specific filters
  filters.value.page = 1
  switch (tab) {
    case 'upcoming':
      filters.value.status = ''
      filters.value.date_from = new Date().toISOString().split('T')[0]
      filters.value.date_to = ''
      break
    case 'past':
      filters.value.status = 'completed'
      filters.value.date_from = ''
      filters.value.date_to = new Date().toISOString().split('T')[0]
      break
    case 'drafts':
      filters.value.status = 'draft'
      filters.value.date_from = ''
      filters.value.date_to = ''
      break
    case 'cancelled':
      filters.value.status = 'cancelled'
      filters.value.date_from = ''
      filters.value.date_to = ''
      break
    case 'all':
      filters.value.status = ''
      filters.value.date_from = ''
      filters.value.date_to = ''
      break
  }
  loadHikes()
}

function navigateToCreate() {
  router.push({ name: 'group-hikes-create' })
}

function navigateToEdit(hike: GroupHikeListItem) {
  router.push({ name: 'group-hikes-edit', params: { id: hike.id } })
}

function navigateToDetail(hike: GroupHikeListItem) {
  router.push({ name: 'group-hike-detail', params: { id: hike.id } })
}

async function handlePublish(hike: GroupHikeListItem) {
  await actions.publish(hike.id, loadHikes)
}

async function handleUnpublish(hike: GroupHikeListItem) {
  await actions.unpublish(hike.id, loadHikes)
}

function openCancelModal(hike: GroupHikeListItem) {
  hikeForAction.value = hike
  showCancelModal.value = true
}

async function handleCancelConfirm(reason: string) {
  if (!hikeForAction.value) return
  await actions.cancel(hikeForAction.value.id, reason, () => {
    showCancelModal.value = false
    hikeForAction.value = null
    loadHikes()
  })
}

function openDeleteModal(hike: GroupHikeListItem) {
  hikeForAction.value = hike
  showDeleteModal.value = true
}

async function handleDeleteConfirm() {
  if (!hikeForAction.value) return
  await actions.remove(hikeForAction.value.id, () => {
    showDeleteModal.value = false
    hikeForAction.value = null
  })
}

onMounted(async () => {
  await Promise.all([
    loadHikes(),
    trailsStore.ensureRegions(),
  ])
})
</script>

<template>
  <div class="list-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Group Hikes</h1>
        <p>Manage hiking events and experiences</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" @click="navigateToCreate">
        Create Group Hike
      </button>
    </div>

    <!-- Tabs -->
    <div class="tab-nav">
      <button
        v-for="tab in (['upcoming', 'past', 'drafts', 'cancelled', 'all'] as const)"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="switchTab(tab)"
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search group hikes..."
          class="search-input"
          @input="handleSearchInput(loadHikes)"
        />
      </div>

      <div class="filter-group">
        <!-- Status filter (all tab only) -->
        <select
          v-if="activeTab === 'all'"
          v-model="filters.status"
          class="filter-select"
          @change="handleFilterChange(loadHikes)"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>

        <!-- Region filter -->
        <select
          v-model="filters.region_id"
          class="filter-select"
          @change="handleFilterChange(loadHikes)"
        >
          <option :value="null">All Regions</option>
          <option
            v-for="region in trailsStore.regions"
            :key="region.id"
            :value="region.id"
          >
            {{ region.name }}
          </option>
        </select>

        <!-- Date range -->
        <input
          v-model="filters.date_from"
          type="date"
          class="filter-select"
          title="From date"
          @change="handleFilterChange(loadHikes)"
        />
        <input
          v-model="filters.date_to"
          type="date"
          class="filter-select"
          title="To date"
          @change="handleFilterChange(loadHikes)"
        />

        <!-- View toggle -->
        <div class="view-toggle">
          <button class="toggle-btn" :class="{ active: viewMode === 'table' }" title="Table view" @click="viewMode = 'table'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" title="Grid view" @click="viewMode = 'grid'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        <button v-if="hasActiveFilters" class="btn btn-secondary btn-sm" @click="clearFilters(loadHikes)">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-state">
      <div class="spinner" />
      <p>Loading group hikes...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="error-state">
      <p>{{ store.error }}</p>
      <button class="btn btn-secondary" @click="loadHikes">Try Again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="store.groupHikes.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
        <path d="M17 8C8 10 5.9 16.17 3.82 19.15a1 1 0 001.43 1.38A6.84 6.84 0 018.5 19c2 0 3.5 1 6.5 1s5-2 5-7c0-7-3.5-5-3-5z" />
      </svg>
      <p v-if="hasActiveFilters">No hikes match your filters.</p>
      <template v-else>
        <p>No group hikes yet.</p>
        <button v-if="canCreate" class="btn btn-primary" @click="navigateToCreate">
          Create Group Hike
        </button>
      </template>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="hikes-grid">
      <GroupHikeCard
        v-for="hike in store.groupHikes"
        :key="hike.id"
        :hike="hike"
        @view="navigateToDetail"
        @edit="navigateToEdit"
        @publish="handlePublish"
        @unpublish="handleUnpublish"
        @cancel="openCancelModal"
        @delete="openDeleteModal"
      />
    </div>

    <!-- Table View -->
    <div v-else>
      <GroupHikeTable
        :hikes="store.groupHikes"
        :can-publish="canPublish"
        @view="navigateToDetail"
        @edit="navigateToEdit"
        @publish="handlePublish"
        @unpublish="handleUnpublish"
        @cancel="openCancelModal"
        @delete="openDeleteModal"
      />

      <!-- Pagination -->
      <div v-if="(store.meta?.total ?? 0) > 0" class="pagination-container">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }} hikes
          </span>
          <select v-model="filters.per_page" class="per-page-select" @change="handlePerPageChange(loadHikes)">
            <option :value="15">15 per page</option>
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="(store.meta?.current_page ?? 1) === 1"
            @click="goToPage((store.meta?.current_page ?? 1) - 1, store.meta?.last_page ?? 1, loadHikes)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            v-for="(page, index) in pageNumbers"
            :key="index"
            class="pagination-btn"
            :class="{ active: page === store.meta?.current_page, 'pagination-ellipsis-btn': page === '...' }"
            :disabled="page === '...'"
            @click="page !== '...' && goToPage(page as number, store.meta?.last_page ?? 1, loadHikes)"
          >
            {{ page }}
          </button>
          <button
            class="pagination-btn"
            :disabled="(store.meta?.current_page ?? 1) === (store.meta?.last_page ?? 1)"
            @click="goToPage((store.meta?.current_page ?? 1) + 1, store.meta?.last_page ?? 1, loadHikes)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <CancelModal
      v-if="showCancelModal && hikeForAction"
      :hike-name="hikeForAction.title"
      :loading="actions.actionLoading.value"
      @confirm="handleCancelConfirm"
      @close="showCancelModal = false; hikeForAction = null"
    />

    <!-- Delete Modal -->
    <DeleteConfirmModal
      v-if="showDeleteModal && hikeForAction"
      :hike-name="hikeForAction.title"
      :loading="actions.actionLoading.value"
      @confirm="handleDeleteConfirm"
      @close="showDeleteModal = false; hikeForAction = null"
    />
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

/* Tabs */
.tab-nav {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
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

.empty-icon {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4) 0;
}

/* Grid */
.hikes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
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

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
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

.pagination-ellipsis-btn {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: var(--color-text-secondary);
}

.pagination-ellipsis-btn:hover {
  background: transparent;
  border-color: transparent;
}

@media (max-width: 1024px) {
  .hikes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .hikes-grid {
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
}
</style>
