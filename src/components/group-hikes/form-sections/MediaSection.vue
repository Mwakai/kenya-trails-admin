<script setup lang="ts">
import { computed } from 'vue'
import type { GroupHikeFormData } from '@/types/groupHike'
import type { Media } from '@/types/auth'
import MediaPickerSingle from '@/components/media/MediaPickerSingle.vue'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  featuredImage: Media | null
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
  'featured-image-select': [media: Media]
  'featured-image-remove': []
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Media</h3>

    <!-- Featured Image -->
    <div class="form-group">
      <label class="form-label">Featured Image</label>
      <p class="form-hint">Required before publishing</p>
      <MediaPickerSingle
        :media="featuredImage"
        @select="emit('featured-image-select', $event)"
        @remove="emit('featured-image-remove')"
      />
      <span v-if="errors.featured_image_id" class="error-message">{{ errors.featured_image_id }}</span>
    </div>
  </div>
</template>

<style scoped>
.form-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-5) 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.error-message {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}
</style>
