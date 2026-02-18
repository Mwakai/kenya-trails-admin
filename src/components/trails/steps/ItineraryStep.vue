<script setup lang="ts">
import { inject, computed } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import type { ItineraryDayForm } from '@/types/trail'

const ctx = inject(trailFormKey)!

const errors = computed(() => ctx.stepErrors.value[5] || {})

function addDay() {
  const nextNum = ctx.formData.itinerary.length + 1
  ctx.formData.itinerary.push({
    day_number: nextNum,
    title: '',
    description: '',
    distance_km: null,
    elevation_gain_m: null,
    start_point: '',
    end_point: '',
    accommodation: '',
  })
}

function removeDay(index: number) {
  ctx.formData.itinerary.splice(index, 1)
  renumberDays()
}

function moveDay(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= ctx.formData.itinerary.length) return
  const temp = ctx.formData.itinerary[index]
  ctx.formData.itinerary[index] = ctx.formData.itinerary[target]
  ctx.formData.itinerary[target] = temp
  renumberDays()
}

function renumberDays() {
  ctx.formData.itinerary.forEach((day, i) => {
    day.day_number = i + 1
  })
}

function parseNumber(event: Event): number | null {
  const val = (event.target as HTMLInputElement).value
  if (val === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Day-by-Day Itinerary</h2>
    <p class="step-subtitle">Optional — Add a detailed breakdown of each day. You can skip this and describe the route in the main description instead.</p>

    <div v-if="!ctx.formData.is_multi_day" class="info-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <div>
        <p class="info-title">Itinerary is only available for multi-day treks</p>
        <p class="info-desc">Enable "Multi-day trek" in the Trail Stats step to add an itinerary.</p>
      </div>
    </div>

    <template v-else>
      <div v-if="ctx.formData.itinerary.length === 0" class="empty-state">
        <p class="empty-title">No itinerary added yet</p>
        <p>Click "Add Day" to start building your day-by-day breakdown.</p>
      </div>

      <div
        v-for="(day, index) in ctx.formData.itinerary"
        :key="index"
        class="day-card"
      >
        <div class="day-header">
          <span class="day-badge">Day {{ day.day_number }}</span>
          <div class="day-actions">
            <button
              class="btn-icon"
              title="Move up"
              :disabled="index === 0"
              @click="moveDay(index, -1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <button
              class="btn-icon"
              title="Move down"
              :disabled="index === ctx.formData.itinerary.length - 1"
              @click="moveDay(index, 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              class="btn-icon btn-icon-danger"
              title="Remove day"
              @click="removeDay(index)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">Title <span class="required">*</span></label>
          <input
            v-model="day.title"
            type="text"
            class="form-input"
            :placeholder="`e.g. Summit day, Base camp to Camp 1`"
          />
        </div>

        <div class="form-group">
          <label class="field-label">Description</label>
          <textarea
            v-model="day.description"
            class="form-input"
            rows="2"
            placeholder="Brief description of the day's activities"
          />
        </div>

        <div class="day-stats-grid">
          <div class="form-group">
            <label class="field-label">Distance (km)</label>
            <input
              type="number"
              class="form-input"
              placeholder="0"
              step="0.1"
              min="0"
              :value="day.distance_km ?? ''"
              @input="day.distance_km = parseNumber($event)"
            />
          </div>
          <div class="form-group">
            <label class="field-label">Elevation Gain (m)</label>
            <input
              type="number"
              class="form-input"
              placeholder="0"
              step="1"
              min="0"
              :value="day.elevation_gain_m ?? ''"
              @input="day.elevation_gain_m = parseNumber($event)"
            />
          </div>
        </div>

        <div class="day-stats-grid">
          <div class="form-group">
            <label class="field-label">Start Point</label>
            <input
              v-model="day.start_point"
              type="text"
              class="form-input"
              placeholder="e.g. Naro Moru Gate"
            />
          </div>
          <div class="form-group">
            <label class="field-label">End Point</label>
            <input
              v-model="day.end_point"
              type="text"
              class="form-input"
              placeholder="e.g. Mackinder's Camp"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">Accommodation</label>
          <input
            v-model="day.accommodation"
            type="text"
            class="form-input"
            placeholder="e.g. Camping, Mountain hut"
          />
        </div>
      </div>

      <button class="btn btn-secondary add-day-btn" @click="addDay">
        + Add Day
      </button>
    </template>
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

.info-banner {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-background-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
}

.info-banner svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.info-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.info-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-background-alt);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-state p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.empty-state .empty-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.day-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-badge {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
}

.day-actions {
  display: flex;
  gap: var(--space-1);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover:not(:disabled) {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-icon-danger:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
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

.day-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-alt);
}

.add-day-btn {
  align-self: flex-start;
}

@media (max-width: 640px) {
  .day-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
