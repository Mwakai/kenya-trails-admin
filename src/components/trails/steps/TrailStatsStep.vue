<script setup lang="ts">
import { inject, computed, onMounted, watch } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import { useAmenitiesStore } from '@/stores/amenities'
import type { TrailDifficulty, DurationType, AccommodationType } from '@/types/trail'

const ctx = inject(trailFormKey)!
const amenitiesStore = useAmenitiesStore()

const errors = computed(() => ctx.stepErrors.value[1] || {})

const difficulties: { value: TrailDifficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Flat or gentle terrain, suitable for beginners' },
  { value: 'moderate', label: 'Moderate', description: 'Some elevation gain, uneven terrain' },
  { value: 'difficult', label: 'Difficult', description: 'Steep terrain, requires good fitness' },
  { value: 'expert', label: 'Expert', description: 'Technical climbing, high altitude, very demanding' },
]

const months = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

const accommodationOptions: { value: AccommodationType; label: string }[] = [
  { value: 'camping', label: 'Camping' },
  { value: 'huts', label: 'Huts' },
  { value: 'bandas', label: 'Bandas' },
  { value: 'hotels', label: 'Hotels' },
]

const seasonOpen = computed(() => !ctx.formData.is_year_round)
const requirementsOpen = computed(() => ctx.formData.is_multi_day || ctx.formData.requires_guide || ctx.formData.requires_permit)

const durationPreview = computed(() => {
  const min = ctx.formData.duration_min
  const max = ctx.formData.duration_max
  const type = ctx.formData.duration_type
  const unit = type === 'days' ? 'day' : 'hour'
  if (min != null && max != null && max > min) {
    return `${min}–${max} ${unit}s`
  }
  if (min != null) {
    return `${min} ${unit}${min !== 1 ? 's' : ''}`
  }
  return null
})

function setDifficulty(val: TrailDifficulty) {
  ctx.formData.difficulty = val
}

function setDurationType(val: DurationType) {
  ctx.formData.duration_type = val
  if (val === 'days') {
    ctx.formData.is_multi_day = true
  } else {
    // If switching to hours, auto-unset multi-day only if duration_min < 24
    if (ctx.formData.duration_min == null || ctx.formData.duration_min < 24) {
      ctx.formData.is_multi_day = false
    }
  }
}

function parseNumber(event: Event): number | null {
  const val = (event.target as HTMLInputElement).value
  if (val === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

function toggleAmenity(id: number) {
  const idx = ctx.formData.amenity_ids.indexOf(id)
  if (idx === -1) {
    ctx.formData.amenity_ids.push(id)
  } else {
    ctx.formData.amenity_ids.splice(idx, 1)
  }
}

function toggleMonth(month: number) {
  const idx = ctx.formData.best_months.indexOf(month)
  if (idx === -1) {
    ctx.formData.best_months.push(month)
  } else {
    ctx.formData.best_months.splice(idx, 1)
  }
}

function setQuickSeason(preset: 'dry1' | 'dry2' | 'all') {
  if (preset === 'dry1') {
    ctx.formData.best_months = [1, 2, 3]
  } else if (preset === 'dry2') {
    ctx.formData.best_months = [7, 8, 9, 10]
  } else {
    ctx.formData.best_months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }
}

function toggleAccommodation(type: AccommodationType) {
  const idx = ctx.formData.accommodation_types.indexOf(type)
  if (idx === -1) {
    ctx.formData.accommodation_types.push(type)
  } else {
    ctx.formData.accommodation_types.splice(idx, 1)
  }
}

// Auto-set is_multi_day when duration_type is days
watch(() => ctx.formData.duration_type, (val) => {
  if (val === 'days') {
    ctx.formData.is_multi_day = true
  }
})

onMounted(() => {
  if (amenitiesStore.amenities.length === 0) {
    amenitiesStore.fetchAmenities()
  }
})
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Trail Stats & Requirements</h2>
    <p class="step-subtitle">Set difficulty, distance, duration, seasons, and requirements.</p>

    <div class="form-group">
      <label class="field-label">Difficulty <span class="required">*</span></label>
      <div class="difficulty-grid">
        <button
          v-for="d in difficulties"
          :key="d.value"
          class="difficulty-card"
          :class="{ selected: ctx.formData.difficulty === d.value }"
          @click="setDifficulty(d.value)"
        >
          <span class="diff-label">{{ d.label }}</span>
          <span class="diff-desc">{{ d.description }}</span>
        </button>
      </div>
      <span v-if="errors.difficulty" class="error-msg">{{ errors.difficulty }}</span>
    </div>

    <div class="stats-grid">
      <div class="form-group">
        <label class="field-label" for="distance">Distance (km) <span class="required">*</span></label>
        <input
          id="distance"
          type="number"
          class="form-input"
          :class="{ 'input-error': errors.distance_km }"
          placeholder="0"
          step="0.1"
          min="0"
          :value="ctx.formData.distance_km ?? ''"
          @input="ctx.formData.distance_km = parseNumber($event)"
        />
        <span v-if="errors.distance_km" class="error-msg">{{ errors.distance_km }}</span>
      </div>

      <div class="form-group">
        <label class="field-label" for="elevation">Elevation Gain (m)</label>
        <input
          id="elevation"
          type="number"
          class="form-input"
          placeholder="0"
          step="1"
          min="0"
          :value="ctx.formData.elevation_gain_m ?? ''"
          @input="ctx.formData.elevation_gain_m = parseNumber($event)"
        />
      </div>

      <div class="form-group">
        <label class="field-label" for="altitude">Max Altitude (m)</label>
        <input
          id="altitude"
          type="number"
          class="form-input"
          placeholder="0"
          step="1"
          min="0"
          :value="ctx.formData.max_altitude_m ?? ''"
          @input="ctx.formData.max_altitude_m = parseNumber($event)"
        />
      </div>
    </div>

    <!-- Duration Section -->
    <div class="section-card">
      <h3 class="section-heading">Duration</h3>
      <div class="duration-type-toggle">
        <button
          class="toggle-btn"
          :class="{ active: ctx.formData.duration_type === 'hours' }"
          @click="setDurationType('hours')"
        >
          Hours
        </button>
        <button
          class="toggle-btn"
          :class="{ active: ctx.formData.duration_type === 'days' }"
          @click="setDurationType('days')"
        >
          Days
        </button>
      </div>
      <div class="duration-range">
        <div class="form-group">
          <label class="field-label" for="duration-min">From</label>
          <input
            id="duration-min"
            type="number"
            class="form-input"
            placeholder="Min"
            step="0.5"
            min="0"
            :value="ctx.formData.duration_min ?? ''"
            @input="ctx.formData.duration_min = parseNumber($event)"
          />
        </div>
        <div class="form-group">
          <label class="field-label" for="duration-max">To</label>
          <input
            id="duration-max"
            type="number"
            class="form-input"
            placeholder="Max"
            step="0.5"
            min="0"
            :value="ctx.formData.duration_max ?? ''"
            @input="ctx.formData.duration_max = parseNumber($event)"
          />
        </div>
      </div>
      <p v-if="durationPreview" class="duration-preview">{{ durationPreview }}</p>
      <label class="checkbox-row">
        <input
          type="checkbox"
          :checked="ctx.formData.is_multi_day"
          @change="ctx.formData.is_multi_day = ($event.target as HTMLInputElement).checked"
        />
        <span>Multi-day trek</span>
      </label>
    </div>

    <!-- Season Section -->
    <div class="section-card">
      <button class="section-toggle" @click="ctx.formData.is_year_round = !ctx.formData.is_year_round">
        <h3 class="section-heading">Best Season</h3>
        <span class="toggle-indicator">{{ ctx.formData.is_year_round ? 'Year-round' : 'Seasonal' }}</span>
      </button>
      <label class="checkbox-row">
        <input
          type="checkbox"
          :checked="ctx.formData.is_year_round"
          @change="ctx.formData.is_year_round = ($event.target as HTMLInputElement).checked"
        />
        <span>Available year-round</span>
      </label>
      <template v-if="!ctx.formData.is_year_round">
        <div class="month-grid">
          <button
            v-for="m in months"
            :key="m.value"
            class="month-btn"
            :class="{ selected: ctx.formData.best_months.includes(m.value) }"
            @click="toggleMonth(m.value)"
          >
            {{ m.label }}
          </button>
        </div>
        <div class="quick-season-btns">
          <button class="btn-tag" @click="setQuickSeason('dry1')">Dry Season 1 (Jan–Mar)</button>
          <button class="btn-tag" @click="setQuickSeason('dry2')">Dry Season 2 (Jul–Oct)</button>
          <button class="btn-tag" @click="setQuickSeason('all')">All Year</button>
        </div>
        <div class="form-group">
          <label class="field-label" for="season-notes">Season Notes</label>
          <textarea
            id="season-notes"
            v-model="ctx.formData.season_notes"
            class="form-input"
            rows="2"
            placeholder="e.g. Best visited during dry seasons, avoid April-May heavy rains"
          />
        </div>
      </template>
    </div>

    <!-- Requirements Section -->
    <div class="section-card">
      <h3 class="section-heading">Requirements</h3>
      <label class="checkbox-row">
        <input
          type="checkbox"
          :checked="ctx.formData.requires_guide"
          @change="ctx.formData.requires_guide = ($event.target as HTMLInputElement).checked"
        />
        <span>Requires a guide</span>
      </label>
      <label class="checkbox-row">
        <input
          type="checkbox"
          :checked="ctx.formData.requires_permit"
          @change="ctx.formData.requires_permit = ($event.target as HTMLInputElement).checked"
        />
        <span>Requires a permit</span>
      </label>
      <div v-if="ctx.formData.requires_permit" class="form-group">
        <label class="field-label" for="permit-info">Permit Details</label>
        <textarea
          id="permit-info"
          v-model="ctx.formData.permit_info"
          class="form-input"
          rows="2"
          placeholder="e.g. KWS permit required, costs KSH 1000 per person"
        />
      </div>
      <template v-if="ctx.formData.is_multi_day">
        <label class="field-label">Accommodation Types</label>
        <div class="accommodation-grid">
          <label
            v-for="acc in accommodationOptions"
            :key="acc.value"
            class="amenity-checkbox"
            :class="{ checked: ctx.formData.accommodation_types.includes(acc.value) }"
          >
            <input
              type="checkbox"
              :checked="ctx.formData.accommodation_types.includes(acc.value)"
              @change="toggleAccommodation(acc.value)"
            />
            <span>{{ acc.label }}</span>
          </label>
        </div>
      </template>
    </div>

    <div class="form-group">
      <label class="field-label">Amenities</label>
      <div v-if="amenitiesStore.loading" class="loading-text">Loading amenities...</div>
      <div v-else class="amenity-grid">
        <label
          v-for="amenity in amenitiesStore.amenities.filter((a) => a.is_active)"
          :key="amenity.id"
          class="amenity-checkbox"
          :class="{ checked: ctx.formData.amenity_ids.includes(amenity.id) }"
        >
          <input
            type="checkbox"
            :checked="ctx.formData.amenity_ids.includes(amenity.id)"
            @change="toggleAmenity(amenity.id)"
          />
          <span>{{ amenity.name }}</span>
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

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.difficulty-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}

.difficulty-card:hover {
  border-color: var(--color-border-hover);
}

.difficulty-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.diff-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.diff-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
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

.input-error {
  border-color: var(--color-error) !important;
}

.error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

/* Section Card */
.section-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
  text-align: left;
}

.toggle-indicator {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding: 2px var(--space-2);
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
}

/* Duration */
.duration-type-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: fit-content;
}

.toggle-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: var(--color-background);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
}

.toggle-btn:hover:not(.active) {
  background: var(--color-background-alt);
}

.duration-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.duration-preview {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-row input {
  accent-color: var(--color-primary);
}

/* Month grid */
.month-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}

.month-btn {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
}

.month-btn:hover {
  border-color: var(--color-border-hover);
}

.month-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.quick-season-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.btn-tag {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full, 9999px);
  background: var(--color-background);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-tag:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Accommodation */
.accommodation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.amenity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.amenity-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.amenity-checkbox:hover {
  border-color: var(--color-border-hover);
}

.amenity-checkbox.checked {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.amenity-checkbox input {
  accent-color: var(--color-primary);
}

@media (max-width: 640px) {
  .difficulty-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .month-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .amenity-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .accommodation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
