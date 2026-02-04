<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types/auth'
import MediaPickerModal from '@/components/media/MediaPickerModal.vue'

const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ids: number[]]
}>()

const mediaStore = useMediaStore()
const showPicker = ref(false)

const files = computed(() => {
  return props.modelValue
    .map((id) => mediaStore.media.find((m) => m.id === id))
    .filter((m): m is Media => !!m)
})

function handleSelect(media: Media) {
  if (!props.modelValue.includes(media.id)) {
    emit('update:modelValue', [...props.modelValue, media.id])
  }
  showPicker.value = false
}

function removeFile(id: number) {
  emit('update:modelValue', props.modelValue.filter((i) => i !== id))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="gpx-manager">
    <label class="manager-label">GPX Files</label>

    <div v-if="files.length > 0" class="file-list">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div>
            <span class="file-name">{{ file.original_filename }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
        </div>
        <button class="remove-btn" title="Remove" @click="removeFile(file.id)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <button class="add-btn" @click="showPicker = true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add GPX File
    </button>

    <MediaPickerModal
      :show="showPicker"
      media-type="document"
      @select="handleSelect"
      @close="showPicker = false"
    />
  </div>
</template>

<style scoped>
.gpx-manager {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.manager-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background-alt);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
}

.file-info div {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.file-size {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.remove-btn {
  padding: var(--space-1);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.remove-btn:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  width: fit-content;
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
