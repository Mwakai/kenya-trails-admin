<script setup lang="ts">
import { inject, computed } from 'vue'
import { trailFormKey, type CompletionStatus } from '@/composables/useTrailForm'

const ctx = inject(trailFormKey)!

const completion = computed<CompletionStatus>(() => ctx.completionStatus.value)

const checklistItems = computed(() => [
  {
    key: 'basicInfo',
    label: 'Basic Information',
    complete: completion.value.basicInfo,
    step: 0,
    details: ctx.formData.name || 'Name not set',
  },
  {
    key: 'stats',
    label: 'Trail Stats',
    complete: completion.value.stats,
    step: 1,
    details: ctx.formData.difficulty
      ? `${ctx.formData.difficulty} - ${ctx.formData.distance_km ?? 0} km`
      : 'Not configured',
  },
  {
    key: 'location',
    label: 'Map & Location',
    complete: completion.value.location,
    step: 2,
    details: ctx.formData.location_name || 'Location not set',
  },
  {
    key: 'routes',
    label: 'Routes',
    complete: completion.value.routes,
    step: 3,
    details: ctx.formData.route_a.name
      ? `Route A: ${ctx.formData.route_a.name}${ctx.formData.route_b_enabled ? `, Route B: ${ctx.formData.route_b.name || '(unnamed)'}` : ''}`
      : 'No routes configured',
  },
  {
    key: 'media',
    label: 'Media',
    complete: completion.value.media,
    step: 4,
    details: ctx.formData.featured_image_id
      ? `Featured image set, ${ctx.formData.gallery.length} gallery images`
      : 'Featured image required',
  },
])

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

const previewDescription = computed(() => {
  const stripped = stripHtml(ctx.formData.description)
  return stripped.length > 150 ? stripped.substring(0, 150) + '...' : stripped
})

function getThumbUrl(): string | null {
  const img = ctx.formData.featured_image
  if (!img) return null
  return img.variants?.medium || img.variants?.small || img.url
}
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Review & Publish</h2>
    <p class="step-subtitle">Review your trail details before publishing.</p>

    <!-- Preview Card -->
    <div class="preview-card">
      <div v-if="getThumbUrl()" class="preview-image">
        <img :src="getThumbUrl()!" :alt="ctx.formData.name" />
      </div>
      <div v-else class="preview-image-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <div class="preview-info">
        <h3>{{ ctx.formData.name || 'Untitled Trail' }}</h3>
        <p v-if="ctx.formData.short_description" class="preview-short">
          {{ ctx.formData.short_description }}
        </p>
        <p v-else-if="previewDescription" class="preview-short">{{ previewDescription }}</p>
        <div class="preview-meta">
          <span v-if="ctx.formData.difficulty" class="meta-tag">{{ ctx.formData.difficulty }}</span>
          <span v-if="ctx.formData.distance_km">{{ ctx.formData.distance_km }} km</span>
          <span v-if="ctx.formData.location_name">{{ ctx.formData.location_name }}</span>
        </div>
      </div>
    </div>

    <!-- Completion Checklist -->
    <div class="checklist">
      <h3 class="checklist-title">Completion Checklist</h3>
      <div
        v-for="item in checklistItems"
        :key="item.key"
        class="checklist-item"
        :class="{ complete: item.complete }"
      >
        <div class="checklist-left">
          <div class="check-icon">
            <svg v-if="item.complete" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <span class="check-label">{{ item.label }}</span>
            <span class="check-details">{{ item.details }}</span>
          </div>
        </div>
        <button class="edit-link" @click="ctx.goToStep(item.step)">Edit</button>
      </div>
    </div>

    <!-- Publish Status -->
    <div class="publish-section">
      <h3 class="section-title">Publish Status</h3>
      <div class="status-options">
        <label class="status-option" :class="{ selected: ctx.formData.publish_status === 'draft' }">
          <input
            v-model="ctx.formData.publish_status"
            type="radio"
            value="draft"
          />
          <div>
            <span class="option-label">Draft</span>
            <span class="option-desc">Save as draft, not visible to the public</span>
          </div>
        </label>
        <label class="status-option" :class="{ selected: ctx.formData.publish_status === 'published' }">
          <input
            v-model="ctx.formData.publish_status"
            type="radio"
            value="published"
            :disabled="!ctx.isReadyToPublish.value"
          />
          <div>
            <span class="option-label">Published</span>
            <span class="option-desc">
              {{ ctx.isReadyToPublish.value ? 'Make visible to the public' : 'Complete all checklist items to publish' }}
            </span>
          </div>
        </label>
      </div>
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

/* Preview Card */
.preview-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.preview-image {
  width: 160px;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-image-placeholder {
  width: 160px;
  height: 120px;
  border-radius: var(--radius-md);
  background: var(--color-background-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.preview-info h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.preview-short {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-normal);
}

.preview-meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.meta-tag {
  padding: 1px var(--space-2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

/* Checklist */
.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.checklist-title,
.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.checklist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-background-alt);
}

.checklist-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.check-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.checklist-item.complete .check-icon {
  color: var(--color-primary);
}

.check-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.check-details {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.edit-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.edit-link:hover {
  background: var(--color-primary-light);
}

/* Publish */
.publish-section {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.status-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.status-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.status-option:hover {
  border-color: var(--color-border-hover);
}

.status-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.status-option input {
  margin-top: 2px;
  accent-color: var(--color-primary);
}

.option-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.option-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .preview-card {
    flex-direction: column;
  }

  .preview-image,
  .preview-image-placeholder {
    width: 100%;
  }
}
</style>
