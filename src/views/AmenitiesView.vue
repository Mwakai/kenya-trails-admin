<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAmenitiesStore } from '@/stores/amenities'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'
import type { Amenity, CreateAmenityPayload, UpdateAmenityPayload } from '@/types/auth'

const amenitiesStore = useAmenitiesStore()
const authStore = useAuthStore()

// Sorting state
type SortColumn = 'name' | 'slug' | 'is_active' | null
type SortDirection = 'asc' | 'desc'
const sortColumn = ref<SortColumn>(null)
const sortDirection = ref<SortDirection>('asc')

// Modal state
const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingAmenity = ref<Amenity | null>(null)

// Delete confirmation state
const showDeleteModal = ref(false)
const amenityToDelete = ref<Amenity | null>(null)
const isDeleting = ref(false)

// Form state
const formData = ref({
  name: '',
  slug: '',
  is_active: true,
})
const formError = ref('')
const formErrors = ref<Record<string, string[]>>({})
const isSubmitting = ref(false)

// Computed
const canCreate = computed(() => authStore.hasPermission('amenities.create'))
const canUpdate = computed(() => authStore.hasPermission('amenities.update'))
const canDelete = computed(() => authStore.hasPermission('amenities.delete'))

const modalTitle = computed(() =>
  modalMode.value === 'create' ? 'Create Amenity' : 'Edit Amenity'
)

const sortedAmenities = computed(() => {
  if (!sortColumn.value) {
    return amenitiesStore.amenities
  }

  return [...amenitiesStore.amenities].sort((a, b) => {
    const column = sortColumn.value as SortColumn
    if (!column) return 0

    const aRaw = a[column]
    const bRaw = b[column]

    let aVal: string | number
    let bVal: string | number

    // Handle boolean comparison
    if (typeof aRaw === 'boolean') {
      aVal = aRaw ? 1 : 0
      bVal = (bRaw as boolean) ? 1 : 0
    } else {
      aVal = (aRaw as string).toLowerCase()
      bVal = (bRaw as string).toLowerCase()
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// Methods
function toggleSort(column: SortColumn) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function onNameInput() {
  if (modalMode.value === 'create') {
    formData.value.slug = generateSlug(formData.value.name)
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingAmenity.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(amenity: Amenity) {
  modalMode.value = 'edit'
  editingAmenity.value = amenity
  formData.value = {
    name: amenity.name,
    slug: amenity.slug,
    is_active: amenity.is_active,
  }
  formError.value = ''
  formErrors.value = {}
  showModal.value = true
}

function openDeleteModal(amenity: Amenity) {
  amenityToDelete.value = amenity
  showDeleteModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAmenity.value = null
  resetForm()
}

function closeDeleteModal() {
  showDeleteModal.value = false
  amenityToDelete.value = null
}

function resetForm() {
  formData.value = {
    name: '',
    slug: '',
    is_active: true,
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
      const payload: CreateAmenityPayload = {
        name: formData.value.name,
        slug: formData.value.slug || undefined,
        is_active: formData.value.is_active,
      }
      await amenitiesStore.createAmenity(payload)
    } else if (editingAmenity.value) {
      const payload: UpdateAmenityPayload = {
        name: formData.value.name,
        slug: formData.value.slug || undefined,
        is_active: formData.value.is_active,
      }
      await amenitiesStore.updateAmenity(editingAmenity.value.id, payload)
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
  if (!amenityToDelete.value) return

  isDeleting.value = true
  try {
    await amenitiesStore.deleteAmenity(amenityToDelete.value.id)
    closeDeleteModal()
  } catch (err) {
    if (err instanceof ApiError) {
      alert(err.message)
    } else {
      alert('Failed to delete amenity')
    }
  } finally {
    isDeleting.value = false
  }
}

function getStatusClass(isActive: boolean): string {
  return isActive ? 'status-active' : 'status-inactive'
}

onMounted(async () => {
  await amenitiesStore.fetchAmenities()
})
</script>

<template>
  <div class="amenities-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Amenities</h1>
        <p>Manage trail amenities and features</p>
      </div>
      <button v-if="canCreate" class="btn btn-primary" @click="openCreateModal">
        Add Amenity
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="amenitiesStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading amenities...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="amenitiesStore.error" class="error-state">
      <p>{{ amenitiesStore.error }}</p>
      <button class="btn btn-secondary" @click="amenitiesStore.fetchAmenities()">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="amenitiesStore.amenities.length === 0" class="empty-state">
      <p>No amenities found</p>
      <button v-if="canCreate" class="btn btn-primary" @click="openCreateModal">
        Create your first amenity
      </button>
    </div>

    <!-- Amenities Table -->
    <div v-else class="table-container">
      <table class="amenities-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('name')">
              <span>Name</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'name' }">
                <svg v-if="sortColumn === 'name' && sortDirection === 'desc'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </span>
            </th>
            <th class="sortable" @click="toggleSort('slug')">
              <span>Slug</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'slug' }">
                <svg v-if="sortColumn === 'slug' && sortDirection === 'desc'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </span>
            </th>
            <th class="sortable" @click="toggleSort('is_active')">
              <span>Status</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'is_active' }">
                <svg v-if="sortColumn === 'is_active' && sortDirection === 'desc'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </span>
            </th>
            <th v-if="canUpdate || canDelete">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="amenity in sortedAmenities" :key="amenity.id">
            <td class="amenity-name">
              <span>{{ amenity.name }}</span>
            </td>
            <td class="amenity-slug">{{ amenity.slug }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(amenity.is_active)">
                {{ amenity.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td v-if="canUpdate || canDelete" class="actions-cell">
              <button
                v-if="canUpdate"
                class="btn-icon"
                title="Edit"
                @click="openEditModal(amenity)"
              >
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
                @click="openDeleteModal(amenity)"
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

            <div class="form-group">
              <label for="name">Name *</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                :class="{ 'input-error': getFieldError('name') }"
                :disabled="isSubmitting"
                @input="onNameInput"
              />
              <span v-if="getFieldError('name')" class="field-error">
                {{ getFieldError('name') }}
              </span>
            </div>

            <div class="form-group">
              <label for="slug">Slug</label>
              <input
                id="slug"
                v-model="formData.slug"
                type="text"
                :class="{ 'input-error': getFieldError('slug') }"
                :disabled="isSubmitting"
                placeholder="auto-generated-from-name"
              />
              <span v-if="getFieldError('slug')" class="field-error">
                {{ getFieldError('slug') }}
              </span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="formData.is_active"
                  :disabled="isSubmitting"
                />
                <span>Active</span>
              </label>
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
                isSubmitting
                  ? 'Saving...'
                  : modalMode === 'create'
                    ? 'Create Amenity'
                    : 'Save Changes'
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
          <h2>Delete Amenity</h2>
          <button class="btn-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete <strong>{{ amenityToDelete?.name }}</strong>? This
            action cannot be undone.
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
.amenities-page {
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

.amenities-table {
  width: 100%;
  border-collapse: collapse;
}

.amenities-table th,
.amenities-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.amenities-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.amenities-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast);
}

.amenities-table th.sortable:hover {
  color: var(--color-text-primary);
}

.amenities-table th.sortable span {
  display: inline-flex;
  align-items: center;
}

.sort-icon {
  margin-left: var(--space-1);
  opacity: 0.3;
  transition: opacity var(--transition-fast);
}

.sort-icon.active {
  opacity: 1;
  color: var(--color-primary);
}

.amenities-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.amenities-table tbody tr:hover {
  background: var(--color-background-alt);
}

.amenities-table tbody tr:last-child td {
  border-bottom: none;
}

.amenity-name {
  font-weight: var(--font-weight-medium);
}

.amenity-slug {
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
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
  max-width: 480px;
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

.form-group input[type='text'],
.form-group textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.form-group input:disabled,
.form-group textarea:disabled {
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }
}
</style>
