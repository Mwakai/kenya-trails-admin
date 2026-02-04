<script setup lang="ts">
import { inject, computed, onMounted } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import { useAmenitiesStore } from '@/stores/amenities'
import type { TrailDifficulty } from '@/types/trail'

const ctx = inject(trailFormKey)!
const amenitiesStore = useAmenitiesStore()

const errors = computed(() => ctx.stepErrors.value[1] || {})

const difficulties: { value: TrailDifficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Flat or gentle terrain, suitable for beginners' },
  { value: 'moderate', label: 'Moderate', description: 'Some elevation gain, uneven terrain' },
  { value: 'difficult', label: 'Difficult', description: 'Steep terrain, requires good fitness' },
  { value: 'expert', label: 'Expert', description: 'Technical climbing, high altitude, very demanding' },
]

function setDifficulty(val: TrailDifficulty) {
  ctx.formData.difficulty = val
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

onMounted(() => {
  if (amenitiesStore.amenities.length === 0) {
    amenitiesStore.fetchAmenities()
  }
})
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Trail Stats</h2>
    <p class="step-subtitle">Set difficulty, distance, and other trail statistics.</p>

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
        <label class="field-label" for="duration">Duration (hours)</label>
        <input
          id="duration"
          type="number"
          class="form-input"
          placeholder="0"
          step="0.5"
          min="0"
          :value="ctx.formData.duration_hours ?? ''"
          @input="ctx.formData.duration_hours = parseNumber($event)"
        />
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
  grid-template-columns: repeat(2, 1fr);
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

  .amenity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
