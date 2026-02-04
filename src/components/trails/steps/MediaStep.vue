<script setup lang="ts">
import { inject, computed } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import type { Media } from '@/types/auth'
import MediaPickerSingle from '@/components/media/MediaPickerSingle.vue'
import GalleryManager from '@/components/trails/GalleryManager.vue'
import VideoEmbedPreview from '@/components/trails/VideoEmbedPreview.vue'

const ctx = inject(trailFormKey)!

const errors = computed(() => ctx.stepErrors.value[4] || {})

function handleFeaturedSelect(media: Media) {
  ctx.formData.featured_image_id = media.id
  ctx.formData.featured_image = media
}

function handleFeaturedRemove() {
  ctx.formData.featured_image_id = null
  ctx.formData.featured_image = null
}
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Media</h2>
    <p class="step-subtitle">Add a featured image, gallery photos, and optional video.</p>

    <div class="form-group">
      <MediaPickerSingle
        :media="ctx.formData.featured_image"
        label="Featured Image"
        @select="handleFeaturedSelect"
        @remove="handleFeaturedRemove"
      />
      <span v-if="errors.featured_image_id" class="error-msg">{{ errors.featured_image_id }}</span>
    </div>

    <GalleryManager
      :model-value="ctx.formData.gallery"
      @update:model-value="ctx.formData.gallery = $event"
    />

    <div class="form-group">
      <label class="field-label" for="video-url">Video URL</label>
      <input
        id="video-url"
        v-model="ctx.formData.video_url"
        type="url"
        class="form-input"
        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
      />
      <VideoEmbedPreview v-if="ctx.formData.video_url" :url="ctx.formData.video_url" />
    </div>
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.step-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.step-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: -12px 0 0 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}
</style>
