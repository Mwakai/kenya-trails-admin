<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import type { Media, MediaType } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    show: boolean
    multiple?: boolean
    mediaType?: MediaType
    selectedIds?: number[]
  }>(),
  {
    multiple: false,
    mediaType: undefined,
    selectedIds: () => [],
  },
)

const emit = defineEmits<{
  select: [media: Media]
  'select-multiple': [media: Media[]]
  close: []
}>()

const mediaStore = useMediaStore()
const activeTab = ref<'browse' | 'upload'>('browse')
const selectedMap = ref<Map<number, Media>>(new Map())
const uploadFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)

const filteredMedia = computed(() => {
  if (!props.mediaType) return mediaStore.media
  return mediaStore.media.filter((m) => m.type === props.mediaType)
})

const canLoadMore = computed(() => {
  const m = mediaStore.meta
  return m && m.current_page < m.last_page
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedMap.value = new Map()
      if (props.selectedIds.length > 0) {
        for (const m of mediaStore.media) {
          if (props.selectedIds.includes(m.id)) {
            selectedMap.value.set(m.id, m)
          }
        }
      }
      if (mediaStore.media.length === 0) {
        mediaStore.fetchMedia(1, props.mediaType)
      }
    }
  },
)

onMounted(() => {
  if (mediaStore.media.length === 0) {
    mediaStore.fetchMedia(1, props.mediaType)
  }
})

function isSelected(id: number): boolean {
  return selectedMap.value.has(id)
}

function toggleSelect(media: Media) {
  if (props.multiple) {
    if (selectedMap.value.has(media.id)) {
      selectedMap.value.delete(media.id)
    } else {
      selectedMap.value.set(media.id, media)
    }
  } else {
    selectedMap.value = new Map([[media.id, media]])
  }
}

function confirmSelection() {
  if (props.multiple) {
    emit('select-multiple', Array.from(selectedMap.value.values()))
  } else {
    const first = selectedMap.value.values().next().value
    if (first) emit('select', first)
  }
  emit('close')
}

function loadMore() {
  const m = mediaStore.meta
  if (m && m.current_page < m.last_page) {
    mediaStore.fetchMedia(m.current_page + 1, props.mediaType)
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    uploadFile.value = input.files[0]
    uploadError.value = null
  }
}

async function handleUpload() {
  if (!uploadFile.value) return

  isUploading.value = true
  uploadProgress.value = 0
  uploadError.value = null

  try {
    const media = await mediaStore.uploadFile(uploadFile.value, '', (percent) => {
      uploadProgress.value = percent
    })
    uploadFile.value = null
    uploadProgress.value = 0

    // Auto-select the uploaded file
    if (props.multiple) {
      selectedMap.value.set(media.id, media)
    } else {
      selectedMap.value = new Map([[media.id, media]])
    }

    activeTab.value = 'browse'
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    isUploading.value = false
  }
}

function getThumbUrl(media: Media): string {
  if (media.variants?.thumbnail) return media.variants.thumbnail
  if (media.variants?.small) return media.variants.small
  return media.url
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>{{ multiple ? 'Select Media' : 'Select Image' }}</h2>
        <button class="btn-close" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'browse' }"
          @click="activeTab = 'browse'"
        >
          Browse
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'upload' }"
          @click="activeTab = 'upload'"
        >
          Upload
        </button>
      </div>

      <div class="modal-body">
        <!-- Browse Tab -->
        <div v-if="activeTab === 'browse'">
          <div v-if="mediaStore.loading && filteredMedia.length === 0" class="loading-state">
            <div class="spinner" />
            <p>Loading media...</p>
          </div>

          <div v-else-if="filteredMedia.length === 0" class="empty-state">
            <p>No media found. Upload some files first.</p>
          </div>

          <div v-else class="media-grid">
            <div
              v-for="item in filteredMedia"
              :key="item.id"
              class="media-item"
              :class="{ selected: isSelected(item.id) }"
              @click="toggleSelect(item)"
            >
              <img
                v-if="item.type === 'image'"
                :src="getThumbUrl(item)"
                :alt="item.alt_text || item.original_filename"
              />
              <div v-else class="file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span class="file-name">{{ item.original_filename }}</span>
              </div>
              <div v-if="isSelected(item.id)" class="selected-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
          </div>

          <div v-if="canLoadMore" class="load-more">
            <button class="btn btn-secondary" :disabled="mediaStore.loading" @click="loadMore">
              {{ mediaStore.loading ? 'Loading...' : 'Load More' }}
            </button>
          </div>
        </div>

        <!-- Upload Tab -->
        <div v-if="activeTab === 'upload'" class="upload-area">
          <div class="upload-zone">
            <input type="file" class="file-input" @change="handleFileChange" />
            <p v-if="!uploadFile">Click or drag a file to upload</p>
            <p v-else>{{ uploadFile.name }}</p>
          </div>

          <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>

          <div v-if="isUploading" class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }" />
          </div>

          <button
            class="btn btn-primary"
            :disabled="!uploadFile || isUploading"
            @click="handleUpload"
          >
            {{ isUploading ? `Uploading ${uploadProgress}%...` : 'Upload' }}
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <span class="selection-count">
          {{ selectedMap.size }} selected
        </span>
        <div class="footer-actions">
          <button class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="selectedMap.size === 0"
            @click="confirmSelection"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-lg {
  max-width: 800px;
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

.btn-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1;
}

.modal-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-6);
}

.tab-btn {
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
  min-height: 300px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color var(--transition-fast);
  background: var(--color-background-alt);
}

.media-item:hover {
  border-color: var(--color-border-hover);
}

.media-item.selected {
  border-color: var(--color-primary);
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-2);
  color: var(--color-text-secondary);
}

.file-name {
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
  text-align: center;
  word-break: break-all;
  max-height: 2.4em;
  overflow: hidden;
}

.selected-check {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-more {
  text-align: center;
  margin-top: var(--space-4);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.upload-zone {
  position: relative;
  width: 100%;
  padding: var(--space-12);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--color-text-secondary);
  transition: border-color var(--transition-fast);
}

.upload-zone:hover {
  border-color: var(--color-primary);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-fast);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.selection-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.footer-actions {
  display: flex;
  gap: var(--space-3);
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
