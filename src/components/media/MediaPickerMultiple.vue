<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import type { Media } from '@/types/auth'
import MediaPickerModal from './MediaPickerModal.vue'

const props = defineProps<{
  modelValue: number[]
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [ids: number[]]
}>()

const mediaStore = useMediaStore()
const showPicker = ref(false)

const selectedMedia = computed(() => {
  return props.modelValue
    .map((id) => mediaStore.media.find((m) => m.id === id))
    .filter((m): m is Media => !!m)
})

function handleSelectMultiple(media: Media[]) {
  emit('update:modelValue', media.map((m) => m.id))
  showPicker.value = false
}

function removeItem(id: number) {
  emit('update:modelValue', props.modelValue.filter((i) => i !== id))
}

function getThumbUrl(media: Media): string {
  if (media.variants?.thumbnail) return media.variants.thumbnail
  if (media.variants?.small) return media.variants.small
  return media.url
}
</script>

<template>
  <div class="media-picker-multiple">
    <label v-if="label" class="picker-label">{{ label }}</label>

    <div class="items-grid">
      <div v-for="item in selectedMedia" :key="item.id" class="media-thumb">
        <img :src="getThumbUrl(item)" :alt="item.alt_text || item.original_filename" />
        <button class="remove-btn" title="Remove" @click="removeItem(item.id)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <button class="add-btn" @click="showPicker = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Add</span>
      </button>
    </div>

    <MediaPickerModal
      :show="showPicker"
      :multiple="true"
      media-type="image"
      :selected-ids="modelValue"
      @select-multiple="handleSelectMultiple"
      @close="showPicker = false"
    />
  </div>
</template>

<style scoped>
.media-picker-multiple {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.picker-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.media-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.media-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.media-thumb:hover .remove-btn {
  opacity: 1;
}

.add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 80px;
  height: 80px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background-alt);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
