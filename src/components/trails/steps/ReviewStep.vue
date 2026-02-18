<script setup lang="ts">
import { inject, computed, ref } from 'vue'
import { trailFormKey, type CompletionStatus } from '@/composables/useTrailForm'
import { useTrailsStore } from '@/stores/trails'

const ctx = inject(trailFormKey)!
const trailsStore = useTrailsStore()

const completion = computed<CompletionStatus>(() => ctx.completionStatus.value)

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const checklistItems = computed(() => {
  const items = [
    {
      key: 'basicInfo',
      label: 'Basic Information',
      complete: completion.value.basicInfo,
      step: 0,
      details: ctx.formData.name || 'Name not set',
      required: true,
    },
    {
      key: 'stats',
      label: 'Trail Stats & Duration',
      complete: completion.value.stats,
      step: 1,
      details: ctx.formData.difficulty
        ? `${ctx.formData.difficulty} - ${ctx.formData.distance_km ?? 0} km`
        : 'Not configured',
      required: true,
    },
    {
      key: 'location',
      label: 'Location & Region',
      complete: completion.value.location,
      step: 2,
      details: ctx.formData.location_name
        ? `${ctx.formData.location_name}${regionName.value ? ` (${regionName.value})` : ''}`
        : 'Location not set',
      required: true,
    },
    {
      key: 'routes',
      label: 'Routes',
      complete: completion.value.routes,
      step: 3,
      details: ctx.formData.route_a.name
        ? `Route A: ${ctx.formData.route_a.name}${ctx.formData.route_b_enabled ? `, Route B: ${ctx.formData.route_b.name || '(unnamed)'}` : ''}`
        : 'No routes configured',
      required: true,
    },
    {
      key: 'media',
      label: 'Featured Image',
      complete: completion.value.media,
      step: 4,
      details: ctx.formData.featured_image_id
        ? `Featured image set, ${ctx.formData.gallery.length} gallery images`
        : 'Featured image required',
      required: true,
    },
  ]

  // Only show itinerary checklist item for multi-day treks
  if (ctx.formData.is_multi_day) {
    items.push({
      key: 'itinerary',
      label: 'Itinerary',
      complete: completion.value.itinerary,
      step: 5,
      details: ctx.formData.itinerary.length > 0
        ? `${ctx.formData.itinerary.length} day${ctx.formData.itinerary.length !== 1 ? 's' : ''} planned`
        : 'No itinerary added',
      required: false,
    })
  }

  return items
})

const regionName = computed(() => {
  if (!ctx.formData.region_id) return null
  const region = trailsStore.regions.find(r => r.id === ctx.formData.region_id)
  return region?.name ?? null
})

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

const previewDescription = computed(() => {
  const stripped = stripHtml(ctx.formData.description)
  return stripped.length > 150 ? stripped.substring(0, 150) + '...' : stripped
})

const durationText = computed(() => {
  const min = ctx.formData.duration_min
  const max = ctx.formData.duration_max
  const type = ctx.formData.duration_type
  const unit = type === 'days' ? 'day' : 'hr'
  if (min != null && max != null && max > min) {
    return `${min}–${max} ${unit}s`
  }
  if (min != null) {
    return `${min} ${unit}${min !== 1 ? 's' : ''}`
  }
  return null
})

const seasonText = computed(() => {
  if (ctx.formData.is_year_round) return 'Year-round'
  if (ctx.formData.best_months.length === 0) return null
  const sorted = [...ctx.formData.best_months].sort((a, b) => a - b)
  return 'Best: ' + sorted.map(m => monthNames[m - 1]).join(', ')
})

const showItineraryPreview = computed(() => {
  return ctx.formData.is_multi_day && ctx.formData.itinerary.length > 0
})

const itineraryExpanded = ref(false)

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
          <span v-if="ctx.formData.is_multi_day" class="meta-tag multi-day-tag">Multi-day trek</span>
          <span v-if="ctx.formData.distance_km">{{ ctx.formData.distance_km }} km</span>
          <span v-if="durationText">{{ durationText }}</span>
        </div>

        <!-- Detail rows -->
        <div class="preview-details">
          <div v-if="regionName" class="detail-row">
            <span class="detail-label">Region:</span>
            <span>{{ regionName }}</span>
          </div>
          <div v-if="ctx.formData.location_name" class="detail-row">
            <span class="detail-label">Location:</span>
            <span>{{ ctx.formData.location_name }}</span>
          </div>
          <div v-if="seasonText" class="detail-row">
            <span class="detail-label">Season:</span>
            <span>{{ seasonText }}</span>
          </div>
          <div v-if="ctx.formData.requires_guide || ctx.formData.requires_permit" class="detail-row">
            <span class="detail-label">Requirements:</span>
            <span class="badge-row">
              <span v-if="ctx.formData.requires_guide" class="req-badge">Guide Required</span>
              <span v-if="ctx.formData.requires_permit" class="req-badge">Permit Required</span>
            </span>
          </div>
          <div v-if="ctx.formData.is_multi_day && ctx.formData.accommodation_types.length > 0" class="detail-row">
            <span class="detail-label">Accommodation:</span>
            <span>{{ ctx.formData.accommodation_types.join(', ') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Itinerary Preview -->
    <div v-if="showItineraryPreview" class="itinerary-preview">
      <button class="section-toggle" @click="itineraryExpanded = !itineraryExpanded">
        <h3 class="section-title">Itinerary ({{ ctx.formData.itinerary.length }} days)</h3>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          :style="{ transform: itineraryExpanded ? 'rotate(180deg)' : '' }"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div v-if="itineraryExpanded" class="itinerary-days">
        <div v-for="day in ctx.formData.itinerary" :key="day.day_number" class="itinerary-day-row">
          <span class="day-num">Day {{ day.day_number }}</span>
          <span class="day-title">{{ day.title }}</span>
          <span v-if="day.distance_km" class="day-stat">{{ day.distance_km }}km</span>
          <span v-if="day.elevation_gain_m" class="day-stat">{{ day.elevation_gain_m }}m gain</span>
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
            <span class="check-label">
              {{ item.label }}
              <span v-if="!item.required" class="optional-tag">Optional</span>
            </span>
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
  flex-wrap: wrap;
  gap: var(--space-2);
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

.multi-day-tag {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.preview-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.detail-row {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

.detail-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
}

.badge-row {
  display: flex;
  gap: var(--space-1);
}

.req-badge {
  padding: 1px var(--space-2);
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

/* Itinerary Preview */
.itinerary-preview {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.section-toggle svg {
  color: var(--color-text-secondary);
  transition: transform var(--transition-fast);
}

.itinerary-days {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.itinerary-day-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.day-num {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  flex-shrink: 0;
  min-width: 48px;
}

.day-title {
  flex: 1;
  color: var(--color-text-primary);
}

.day-stat {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
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
  margin: 0;
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
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.optional-tag {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  padding: 0 var(--space-1);
  background: var(--color-background);
  border-radius: var(--radius-sm);
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
  margin-top: var(--space-3);
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
