<script setup lang="ts">
import { ref } from 'vue'
import type { Media } from '@/types/auth'
import MediaPickerModal from './MediaPickerModal.vue'

defineProps<{
  media: Media | null
  label?: string
}>()

const emit = defineEmits<{
  select: [media: Media]
  remove: []
}>()

const showPicker = ref(false)

function handleSelect(media: Media) {
  emit('select', media)
  showPicker.value = false
}

function getThumbUrl(media: Media): string {
  if (media.variants?.medium) return media.variants.medium
  if (media.variants?.small) return media.variants.small
  return media.url
}
</script>

<template>
  <div class="media-picker-single">
    <label v-if="label" class="picker-label">{{ label }}</label>

    <div v-if="media" class="preview">
      <img :src="getThumbUrl(media)" :alt="media.alt_text || media.original_filename" />
      <div class="preview-actions">
        <button class="btn btn-sm btn-secondary" @click="showPicker = true">Change</button>
        <button class="btn btn-sm btn-secondary" @click="emit('remove')">Remove</button>
      </div>
    </div>

    <button v-else class="select-btn" @click="showPicker = true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>Select Image</span>
    </button>

    <MediaPickerModal
      :show="showPicker"
      media-type="image"
      @select="handleSelect"
      @close="showPicker = false"
    />
  </div>
</template>

<style scoped>
.media-picker-single {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.picker-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.preview {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

.select-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 200px;
  height: 150px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background-alt);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.select-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-sm {
  padding: var(--space-1) var(--space-2);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: white;
}
</style>
