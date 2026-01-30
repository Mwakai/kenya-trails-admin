<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'
import type { Media, MediaType } from '@/types/auth'

const mediaStore = useMediaStore()
const authStore = useAuthStore()

// Permissions
const canCreate = computed(() => authStore.hasPermission('media.create'))
const canUpdate = computed(() => authStore.hasPermission('media.update'))
const canDelete = computed(() => authStore.hasPermission('media.delete'))

// View state
type ViewMode = 'grid' | 'list'
const viewMode = ref<ViewMode>('grid')
const activeFilter = ref<MediaType | undefined>(undefined)
const currentPage = ref(1)

// Sort state (list view)
type SortColumn = 'filename' | 'type' | 'size' | 'created_at'
type SortDirection = 'asc' | 'desc'
const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<SortDirection>('asc')

// Upload state
interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  media?: Media
}
const uploads = ref<UploadItem[]>([])
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const MAX_CONCURRENT = 3

// Detail modal
const selectedMedia = ref<Media | null>(null)
const showDetailModal = ref(false)
const altTextInput = ref('')
const isSavingAlt = ref(false)
const altSaveError = ref('')

// Delete confirmation
const showDeleteModal = ref(false)
const mediaToDelete = ref<Media | null>(null)
const isDeleting = ref(false)

// Lightbox
const showLightbox = ref(false)
const lightboxUrl = ref('')

// File constraints
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  video: ['mp4', 'avi', 'wmv', 'webm'],
  document: ['pdf', 'gpx', 'svg', 'pptx'],
}
const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 20 * 1024 * 1024,
}
const ALL_EXTENSIONS = Object.values(ALLOWED_EXTENSIONS).flat()
const ACCEPT_STRING = ALL_EXTENSIONS.map((e) => `.${e}`).join(',')

// Computed
const sortedMedia = computed(() => {
  if (!sortColumn.value) return mediaStore.media
  return [...mediaStore.media].sort((a, b) => {
    const col = sortColumn.value!
    const aVal = a[col] ?? ''
    const bVal = b[col] ?? ''
    const cmp =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal))
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
})

const hasMore = computed(() => {
  if (!mediaStore.meta) return false
  return mediaStore.meta.current_page < mediaStore.meta.last_page
})

const showingCount = computed(() => {
  if (!mediaStore.meta) return ''
  return `Showing ${mediaStore.media.length} of ${mediaStore.meta.total}`
})

const activeUploads = computed(() => uploads.value.filter((u) => u.status === 'uploading'))

// Methods
function toggleSort(column: SortColumn) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function setFilter(type?: MediaType) {
  activeFilter.value = type
  currentPage.value = 1
  mediaStore.fetchMedia(1, type)
}

async function loadMore() {
  if (!hasMore.value || mediaStore.loading) return
  currentPage.value += 1
  await mediaStore.fetchMedia(currentPage.value, activeFilter.value)
}

// File helpers
function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}

function getFileType(ext: string): string | null {
  for (const [type, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(ext)) return type
  }
  return null
}

function validateFile(file: File): string | null {
  const ext = getFileExtension(file.name)
  if (!ALL_EXTENSIONS.includes(ext)) {
    return `File type .${ext} is not supported`
  }
  const type = getFileType(ext)
  if (type && file.size > MAX_SIZES[type]) {
    return `File exceeds ${formatSize(MAX_SIZES[type])} limit`
  }
  return null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function truncateFilename(name: string, max = 24): string {
  if (name.length <= max) return name
  const ext = name.lastIndexOf('.')
  if (ext === -1) return name.slice(0, max - 3) + '...'
  const base = name.slice(0, ext)
  const extension = name.slice(ext)
  const allowed = max - extension.length - 3
  if (allowed < 1) return name.slice(0, max - 3) + '...'
  return base.slice(0, allowed) + '...' + extension
}

function getThumbnailUrl(item: Media): string {
  if (item.type === 'image' && item.variants) return item.variants.thumbnail
  return item.url
}

function getPreviewUrl(item: Media): string {
  if (item.type === 'image' && item.variants) return item.variants.large
  return item.url
}

function getTypeIcon(type: string): string {
  if (type === 'video') return 'video'
  return 'document'
}

// Upload
function onDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}
function onDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  if (!canCreate.value) return
  const files = e.dataTransfer?.files
  if (files) handleFiles(Array.from(files))
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    handleFiles(Array.from(input.files))
    input.value = ''
  }
}

function handleFiles(files: File[]) {
  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      uploads.value.push({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'error',
        error,
      })
      continue
    }
    const item: UploadItem = {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading',
    }
    uploads.value.push(item)
  }
  processUploadQueue()
}

function processUploadQueue() {
  const pending = uploads.value.filter((u) => u.status === 'uploading' && u.progress === 0)
  const running = activeUploads.value.filter((u) => u.progress > 0)
  const slots = MAX_CONCURRENT - running.length
  for (let i = 0; i < Math.min(slots, pending.length); i++) {
    startUpload(pending[i])
  }
}

async function startUpload(item: UploadItem) {
  try {
    const result = await mediaStore.uploadFile(item.file, undefined, (pct) => {
      item.progress = pct
    })
    item.status = 'done'
    item.media = result
  } catch (err) {
    item.status = 'error'
    item.error = err instanceof ApiError ? err.message : 'Upload failed'
  }
  processUploadQueue()
}

function retryUpload(item: UploadItem) {
  item.status = 'uploading'
  item.progress = 0
  item.error = undefined
  processUploadQueue()
}

function cancelUpload(item: UploadItem) {
  uploads.value = uploads.value.filter((u) => u.id !== item.id)
}

function dismissUpload(item: UploadItem) {
  uploads.value = uploads.value.filter((u) => u.id !== item.id)
}

// Detail modal
function openDetail(item: Media) {
  selectedMedia.value = item
  altTextInput.value = item.alt_text || ''
  altSaveError.value = ''
  showDetailModal.value = true
}

function closeDetail() {
  showDetailModal.value = false
  selectedMedia.value = null
}

async function saveAltText() {
  if (!selectedMedia.value) return
  isSavingAlt.value = true
  altSaveError.value = ''
  try {
    const updated = await mediaStore.updateMedia(selectedMedia.value.id, altTextInput.value)
    selectedMedia.value = updated
  } catch (err) {
    altSaveError.value = err instanceof ApiError ? err.message : 'Failed to save'
  } finally {
    isSavingAlt.value = false
  }
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(window.location.origin + url)
}

function downloadFile(item: Media) {
  const a = document.createElement('a')
  a.href = item.url
  a.download = item.original_filename
  a.click()
}

// Delete
function openDeleteModal(item: Media) {
  mediaToDelete.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  mediaToDelete.value = null
}

async function handleDelete() {
  if (!mediaToDelete.value) return
  isDeleting.value = true
  try {
    await mediaStore.deleteMedia(mediaToDelete.value.id)
    if (selectedMedia.value?.id === mediaToDelete.value.id) {
      closeDetail()
    }
    closeDeleteModal()
  } catch (err) {
    alert(err instanceof ApiError ? err.message : 'Failed to delete')
  } finally {
    isDeleting.value = false
  }
}

// Lightbox
function openLightbox(url: string) {
  lightboxUrl.value = url
  showLightbox.value = true
}
function closeLightbox() {
  showLightbox.value = false
}

// Keyboard
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showLightbox.value) closeLightbox()
    else if (showDeleteModal.value) closeDeleteModal()
    else if (showDetailModal.value) closeDetail()
  }
}

onMounted(() => {
  mediaStore.fetchMedia(1, activeFilter.value)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="media-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Media Library</h1>
        <p>Manage your images, videos, and documents</p>
      </div>
      <div class="header-actions">
        <div class="view-toggle">
          <button
            class="btn-icon"
            :class="{ active: viewMode === 'grid' }"
            title="Grid view"
            @click="viewMode = 'grid'"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            class="btn-icon"
            :class="{ active: viewMode === 'list' }"
            title="List view"
            @click="viewMode = 'list'"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
        <button v-if="canCreate" class="btn btn-primary" @click="fileInputRef?.click()">
          Upload Files
        </button>
        <input
          ref="fileInputRef"
          type="file"
          :accept="ACCEPT_STRING"
          multiple
          hidden
          @change="onFileSelect"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <button
        class="filter-btn"
        :class="{ active: !activeFilter }"
        @click="setFilter(undefined)"
      >
        All
      </button>
      <button
        class="filter-btn"
        :class="{ active: activeFilter === 'image' }"
        @click="setFilter('image')"
      >
        Images
      </button>
      <button
        class="filter-btn"
        :class="{ active: activeFilter === 'video' }"
        @click="setFilter('video')"
      >
        Videos
      </button>
      <button
        class="filter-btn"
        :class="{ active: activeFilter === 'document' }"
        @click="setFilter('document')"
      >
        Documents
      </button>
    </div>

    <!-- Drop Zone -->
    <div
      v-if="canCreate"
      class="drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
      @click="fileInputRef?.click()"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p>Drag files here or click to browse</p>
    </div>

    <!-- Upload Progress Items -->
    <div v-if="uploads.length > 0" class="upload-items">
      <div
        v-for="item in uploads"
        :key="item.id"
        class="upload-item"
        :class="item.status"
      >
        <div class="upload-info">
          <span class="upload-name">{{ truncateFilename(item.file.name) }}</span>
          <span class="upload-size">{{ formatSize(item.file.size) }}</span>
        </div>
        <div v-if="item.status === 'uploading'" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ item.progress }}%</span>
        </div>
        <div v-else-if="item.status === 'error'" class="upload-error">
          <span>{{ item.error }}</span>
          <button class="btn-sm" @click="retryUpload(item)">Retry</button>
          <button class="btn-sm btn-sm-danger" @click="cancelUpload(item)">Dismiss</button>
        </div>
        <div v-else class="upload-done">
          <span>Uploaded</span>
          <button class="btn-sm" @click="dismissUpload(item)">Dismiss</button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="mediaStore.loading && mediaStore.media.length === 0" class="loading-state">
      <div v-if="viewMode === 'grid'" class="skeleton-grid">
        <div v-for="n in 8" :key="n" class="skeleton-card">
          <div class="skeleton-thumb shimmer"></div>
          <div class="skeleton-text shimmer"></div>
          <div class="skeleton-text-sm shimmer"></div>
        </div>
      </div>
      <div v-else>
        <div class="spinner"></div>
        <p>Loading media...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="mediaStore.error" class="error-state">
      <p>Failed to load media. Try again.</p>
      <button class="btn btn-secondary" @click="mediaStore.fetchMedia(1, activeFilter)">
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="mediaStore.media.length === 0 && !mediaStore.loading" class="empty-state">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        class="empty-icon"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <template v-if="activeFilter">
        <p>No {{ activeFilter }} files found</p>
        <button class="btn btn-secondary" @click="setFilter(undefined)">Clear filter</button>
      </template>
      <template v-else>
        <p>No media uploaded yet</p>
        <button v-if="canCreate" class="btn btn-primary" @click="fileInputRef?.click()">
          Upload Files
        </button>
      </template>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="media-grid">
      <div
        v-for="item in sortedMedia"
        :key="item.id"
        class="media-card"
        @click="openDetail(item)"
      >
        <div class="card-thumb">
          <img
            v-if="item.type === 'image'"
            :src="getThumbnailUrl(item)"
            :alt="item.alt_text || item.filename"
            loading="lazy"
          />
          <div v-else-if="item.type === 'video'" class="card-icon-placeholder">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div v-else class="card-icon-placeholder">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div class="card-overlay">
            <button class="overlay-btn" title="View" @click.stop="openDetail(item)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              v-if="canDelete"
              class="overlay-btn overlay-btn-danger"
              title="Delete"
              @click.stop="openDeleteModal(item)"
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
          </div>
          <span class="card-type-badge">{{ item.type }}</span>
        </div>
        <div class="card-info">
          <p class="card-filename" :title="item.filename">
            {{ truncateFilename(item.filename) }}
          </p>
          <div class="card-meta">
            <span>{{ formatSize(item.size) }}</span>
            <span>{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="table-container">
      <table class="media-table">
        <thead>
          <tr>
            <th style="width: 56px">Preview</th>
            <th class="sortable" @click="toggleSort('filename')">
              <span>Filename</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'filename' }">
                <svg
                  v-if="sortColumn === 'filename' && sortDirection === 'desc'"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <svg
                  v-else
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </th>
            <th class="sortable" @click="toggleSort('type')">
              <span>Type</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'type' }">
                <svg
                  v-if="sortColumn === 'type' && sortDirection === 'desc'"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <svg
                  v-else
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </th>
            <th class="sortable" @click="toggleSort('size')">
              <span>Size</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'size' }">
                <svg
                  v-if="sortColumn === 'size' && sortDirection === 'desc'"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <svg
                  v-else
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </th>
            <th>Uploaded by</th>
            <th class="sortable" @click="toggleSort('created_at')">
              <span>Date</span>
              <span class="sort-icon" :class="{ active: sortColumn === 'created_at' }">
                <svg
                  v-if="sortColumn === 'created_at' && sortDirection === 'desc'"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
                <svg
                  v-else
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </th>
            <th v-if="canUpdate || canDelete">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in sortedMedia"
            :key="item.id"
            class="clickable-row"
            @click="openDetail(item)"
          >
            <td>
              <img
                v-if="item.type === 'image'"
                :src="getThumbnailUrl(item)"
                class="list-thumb"
                :alt="item.alt_text || ''"
              />
              <span v-else-if="item.type === 'video'" class="list-thumb-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              <span v-else class="list-thumb-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
            </td>
            <td class="filename-cell" :title="item.filename">
              {{ truncateFilename(item.filename, 36) }}
            </td>
            <td><span class="type-badge">{{ item.type }}</span></td>
            <td>{{ formatSize(item.size) }}</td>
            <td>{{ item.uploaded_by.full_name }}</td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td v-if="canUpdate || canDelete" class="actions-cell" @click.stop>
              <button
                v-if="canUpdate"
                class="btn-icon"
                title="Edit"
                @click="openDetail(item)"
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
                @click="openDeleteModal(item)"
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

    <!-- Pagination -->
    <div v-if="mediaStore.media.length > 0" class="pagination-bar">
      <span class="showing-count">{{ showingCount }}</span>
      <button
        v-if="hasMore"
        class="btn btn-secondary"
        :disabled="mediaStore.loading"
        @click="loadMore"
      >
        {{ mediaStore.loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetailModal && selectedMedia"
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>Media Details</h2>
          <button class="btn-close" @click="closeDetail">&times;</button>
        </div>
        <div class="modal-body detail-body">
          <!-- Preview -->
          <div class="detail-preview">
            <img
              v-if="selectedMedia.type === 'image'"
              :src="getPreviewUrl(selectedMedia)"
              :alt="selectedMedia.alt_text || selectedMedia.filename"
              class="detail-image"
              @click="openLightbox(selectedMedia.variants?.full || selectedMedia.url)"
            />
            <video
              v-else-if="selectedMedia.type === 'video'"
              :src="selectedMedia.url"
              controls
              class="detail-video"
            ></video>
            <div v-else class="detail-doc-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <button class="btn btn-secondary" @click="downloadFile(selectedMedia)">
                Download
              </button>
            </div>
          </div>

          <!-- Metadata -->
          <div class="detail-meta">
            <!-- Alt text -->
            <div class="form-group">
              <label>Alt Text</label>
              <div class="alt-text-row">
                <input
                  v-model="altTextInput"
                  type="text"
                  placeholder="Describe this media..."
                  :disabled="!canUpdate || isSavingAlt"
                />
                <button
                  v-if="canUpdate"
                  class="btn btn-primary btn-sm-save"
                  :disabled="isSavingAlt"
                  @click="saveAltText"
                >
                  {{ isSavingAlt ? 'Saving...' : 'Save' }}
                </button>
              </div>
              <span v-if="altSaveError" class="field-error">{{ altSaveError }}</span>
            </div>

            <!-- Info -->
            <div class="detail-info-grid">
              <div class="info-item">
                <span class="info-label">Original filename</span>
                <span class="info-value">{{ selectedMedia.original_filename }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Type / MIME</span>
                <span class="info-value"
                  >{{ selectedMedia.type }} &middot; {{ selectedMedia.mime_type }}</span
                >
              </div>
              <div
                v-if="selectedMedia.width && selectedMedia.height"
                class="info-item"
              >
                <span class="info-label">Dimensions</span>
                <span class="info-value"
                  >{{ selectedMedia.width }} &times; {{ selectedMedia.height }} px</span
                >
              </div>
              <div v-if="selectedMedia.duration" class="info-item">
                <span class="info-label">Duration</span>
                <span class="info-value">{{ formatDuration(selectedMedia.duration) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">File size</span>
                <span class="info-value">{{ formatSize(selectedMedia.size) }}</span>
              </div>
            </div>

            <!-- Variants (images only) -->
            <div v-if="selectedMedia.variants" class="variants-section">
              <h3>Image Variants</h3>
              <div class="variant-grid">
                <div
                  v-for="(url, name) in selectedMedia.variants"
                  :key="name"
                  class="variant-card"
                >
                  <div class="variant-preview" @click="openLightbox(url)">
                    <img :src="url" :alt="`${name} variant`" loading="lazy" />
                  </div>
                  <div class="variant-footer">
                    <span class="variant-name">
                      {{
                        name === 'full'
                          ? 'Full (1920px)'
                          : name === 'large'
                            ? 'Large (1024px)'
                            : name === 'medium'
                              ? 'Medium (720px)'
                              : name === 'small'
                                ? 'Small (300px)'
                                : 'Thumbnail (150px)'
                      }}
                    </span>
                    <button class="btn-sm" @click="copyUrl(url)">Copy URL</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions">
              <button class="btn btn-secondary" @click="copyUrl(selectedMedia.url)">
                Copy URL
              </button>
              <button class="btn btn-secondary" @click="downloadFile(selectedMedia)">
                Download
              </button>
              <button
                v-if="canDelete"
                class="btn btn-danger"
                @click="openDeleteModal(selectedMedia)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Delete Media</h2>
          <button class="btn-close" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete
            <strong>{{ mediaToDelete?.filename }}</strong
            >?
          </p>
          <p class="delete-note">This action can be undone by an administrator.</p>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            :disabled="isDeleting"
            @click="closeDeleteModal"
          >
            Cancel
          </button>
          <button class="btn btn-danger" :disabled="isDeleting" @click="handleDelete">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="showLightbox" class="lightbox-overlay" @click="closeLightbox">
      <img :src="lightboxUrl" class="lightbox-image" @click.stop />
      <button class="lightbox-close" @click="closeLightbox">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.media-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.view-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.view-toggle .btn-icon {
  border-radius: 0;
  border: none;
  padding: var(--space-2);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-toggle .btn-icon.active {
  background: var(--color-primary);
  color: white;
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

.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.btn-sm:hover {
  background: var(--color-background-alt);
}

.btn-sm-danger {
  border-color: var(--color-error);
  color: var(--color-error);
}

.btn-sm-save {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
}

/* Filters */
.filters-bar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.filter-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--space-4);
  color: var(--color-text-secondary);
}

.drop-zone:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.drop-zone p {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-sm);
}

/* Upload Items */
.upload-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.upload-item {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.upload-item.error {
  border-color: var(--color-error-border);
  background: var(--color-error-bg);
}

.upload-item.done {
  border-color: #86efac;
  background: #f0fdf4;
}

.upload-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.upload-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.upload-size {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-background-alt);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-fast);
  border-radius: 3px;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: right;
}

.upload-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.upload-done {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: #166534;
}

/* Loading / Skeleton */
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

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  width: 100%;
}

.skeleton-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-thumb {
  width: 100%;
  height: 150px;
  background: var(--color-background-alt);
}

.skeleton-text {
  height: 14px;
  margin: var(--space-3) var(--space-3) var(--space-1);
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
}

.skeleton-text-sm {
  height: 10px;
  margin: 0 var(--space-3) var(--space-3);
  width: 60%;
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
}

.shimmer {
  animation: shimmer 1.5s infinite;
  background: linear-gradient(
    90deg,
    var(--color-background-alt) 25%,
    #e8e8e8 50%,
    var(--color-background-alt) 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
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
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4) 0;
}

/* Grid View */
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.media-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-surface);
}

.media-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
}

.card-thumb {
  position: relative;
  width: 100%;
  height: 160px;
  background: var(--color-background-alt);
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-secondary);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.media-card:hover .card-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.overlay-btn:hover {
  background: white;
}

.overlay-btn-danger:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.card-type-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.6);
  color: white;
}

.card-info {
  padding: var(--space-3);
}

.card-filename {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* List View / Table */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.media-table {
  width: 100%;
  border-collapse: collapse;
}

.media-table th,
.media-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.media-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.media-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.media-table th.sortable:hover {
  color: var(--color-text-primary);
}

.media-table th.sortable span {
  display: inline-flex;
  align-items: center;
}

.sort-icon {
  margin-left: var(--space-1);
  opacity: 0.3;
}

.sort-icon.active {
  opacity: 1;
  color: var(--color-primary);
}

.media-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--color-background-alt);
}

.media-table tbody tr:last-child td {
  border-bottom: none;
}

.list-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.list-thumb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-secondary);
}

.filename-cell {
  font-weight: var(--font-weight-medium);
}

.type-badge {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: var(--color-background-alt);
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.actions-cell {
  display: flex;
  gap: var(--space-1);
}

/* Pagination */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.showing-count {
  font-size: var(--font-size-sm);
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
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-sm {
  max-width: 400px;
}

.modal-lg {
  max-width: 1100px;
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

/* Detail Modal */
.detail-body {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-6);
  padding: var(--space-6);
}

.detail-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  overflow: hidden;
  min-height: 200px;
}

.detail-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  cursor: zoom-in;
}

.detail-video {
  width: 100%;
  max-height: 400px;
  border-radius: var(--radius-md);
}

.detail-doc-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  padding: var(--space-8);
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.alt-text-row {
  display: flex;
  gap: var(--space-2);
}

.alt-text-row input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  font-family: inherit;
}

.alt-text-row input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.alt-text-row input:disabled {
  background: var(--color-background-alt);
  cursor: not-allowed;
}

.field-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.detail-info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  word-break: break-all;
}

.variants-section h3 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
}

.variant-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
}

.variant-preview {
  height: 100px;
  background: var(--color-background-alt);
  cursor: zoom-in;
  overflow: hidden;
}

.variant-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.variant-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.variant-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.detail-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.delete-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-modal) + 10);
  cursor: zoom-out;
}

.lightbox-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--space-4);
  }

  .detail-body {
    grid-template-columns: 1fr;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
