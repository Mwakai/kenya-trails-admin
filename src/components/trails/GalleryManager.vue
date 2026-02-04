<script setup lang="ts">
import { ref } from 'vue'
import type { Media } from '@/types/auth'
import MediaPickerModal from '@/components/media/MediaPickerModal.vue'
import draggable from 'vuedraggable'

interface GalleryItem {
  media_id: number
  media: Media
  caption: string
  sort_order: number
}

const props = defineProps<{
  modelValue: GalleryItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [items: GalleryItem[]]
}>()

const showPicker = ref(false)

function handleSelectMultiple(media: Media[]) {
  const existing = new Set(props.modelValue.map((g) => g.media_id))
  const newItems: GalleryItem[] = media
    .filter((m) => !existing.has(m.id))
    .map((m, i) => ({
      media_id: m.id,
      media: m,
      caption: '',
      sort_order: props.modelValue.length + i,
    }))

  emit('update:modelValue', [...props.modelValue, ...newItems])
  showPicker.value = false
}

function removeItem(index: number) {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated.map((item, i) => ({ ...item, sort_order: i })))
}

function updateCaption(index: number, caption: string) {
  const updated: GalleryItem[] = props.modelValue.map((item, i) =>
    i === index ? { media_id: item.media_id, media: item.media, caption, sort_order: item.sort_order } : item,
  )
  emit('update:modelValue', updated)
}

function onDragEnd() {
  emit(
    'update:modelValue',
    props.modelValue.map((item, i) => ({ ...item, sort_order: i })),
  )
}

function getThumbUrl(media: Media): string {
  if (media.variants?.small) return media.variants.small
  if (media.variants?.thumbnail) return media.variants.thumbnail
  return media.url
}
</script>

<template>
  <div class="gallery-manager">
    <label class="manager-label">Gallery Images</label>

    <draggable
      :model-value="modelValue"
      item-key="media_id"
      class="gallery-grid"
      ghost-class="drag-ghost"
      @update:model-value="(val: GalleryItem[]) => emit('update:modelValue', val)"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <div class="gallery-item">
          <div class="item-image">
            <img :src="getThumbUrl(element.media)" :alt="element.caption || 'Gallery image'" />
            <button class="remove-btn" title="Remove" @click="removeItem(index)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div class="drag-handle" title="Drag to reorder">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
              </svg>
            </div>
          </div>
          <input
            class="caption-input"
            type="text"
            placeholder="Caption..."
            :value="element.caption"
            @input="updateCaption(index, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>
    </draggable>

    <button class="add-btn" @click="showPicker = true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add Images
    </button>

    <MediaPickerModal
      :show="showPicker"
      :multiple="true"
      media-type="image"
      :selected-ids="modelValue.map((g) => g.media_id)"
      @select-multiple="handleSelectMultiple"
      @close="showPicker = false"
    />
  </div>
</template>

<style scoped>
.gallery-manager {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.manager-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}

.gallery-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-image {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  cursor: grab;
}

.item-image:active {
  cursor: grabbing;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  width: 22px;
  height: 22px;
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

.gallery-item:hover .remove-btn {
  opacity: 1;
}

.drag-handle {
  position: absolute;
  top: var(--space-1);
  left: var(--space-1);
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.gallery-item:hover .drag-handle {
  opacity: 1;
}

.caption-input {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
}

.caption-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.drag-ghost {
  opacity: 0.5;
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
