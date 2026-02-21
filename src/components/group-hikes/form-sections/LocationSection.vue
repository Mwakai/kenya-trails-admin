<script setup lang="ts">
import type { GroupHikeFormData, Difficulty } from '@/types/groupHike'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  regions: Array<{ id: number; name: string }>
  trails: Array<{ id: number; name: string; slug: string; difficulty: Difficulty }>
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}

function handleLocationTypeChange(type: 'trail' | 'custom') {
  update('location_type', type)
  if (type === 'trail') {
    update('difficulty', null)
    update('region_id', null)
    update('custom_location_name', '')
    update('latitude', null)
    update('longitude', null)
  } else {
    update('trail_id', null)
  }
}

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'difficult', label: 'Difficult' },
  { value: 'expert', label: 'Expert' },
]
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Location</h3>

    <!-- Location type -->
    <div class="form-group">
      <label class="form-label required">Location Type</label>
      <div class="radio-group">
        <label class="radio-label">
          <input
            type="radio"
            name="location_type"
            value="trail"
            :checked="formData.location_type === 'trail'"
            @change="handleLocationTypeChange('trail')"
          />
          <span>Existing Trail</span>
        </label>
        <label class="radio-label">
          <input
            type="radio"
            name="location_type"
            value="custom"
            :checked="formData.location_type === 'custom'"
            @change="handleLocationTypeChange('custom')"
          />
          <span>Custom Location</span>
        </label>
      </div>
    </div>

    <!-- Trail selection -->
    <template v-if="formData.location_type === 'trail'">
      <div class="form-group">
        <label class="form-label required">Trail</label>
        <select
          class="form-select"
          :class="{ 'input-error': errors.trail_id }"
          :value="formData.trail_id ?? ''"
          @change="update('trail_id', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Select a trail...</option>
          <option
            v-for="trail in trails"
            :key="trail.id"
            :value="trail.id"
          >
            {{ trail.name }}
          </option>
        </select>
        <span v-if="errors.trail_id" class="error-message">{{ errors.trail_id }}</span>
      </div>
    </template>

    <!-- Custom location -->
    <template v-else>
      <div class="form-group">
        <label class="form-label required">Location Name</label>
        <input
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.custom_location_name }"
          :value="formData.custom_location_name"
          placeholder="e.g. Karura Forest, Nairobi"
          @input="update('custom_location_name', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.custom_location_name" class="error-message">{{ errors.custom_location_name }}</span>
      </div>

      <div class="two-col">
        <div class="form-group">
          <label class="form-label required">Region</label>
          <select
            class="form-select"
            :class="{ 'input-error': errors.region_id }"
            :value="formData.region_id ?? ''"
            @change="update('region_id', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
          >
            <option value="">Select region...</option>
            <option v-for="region in regions" :key="region.id" :value="region.id">
              {{ region.name }}
            </option>
          </select>
          <span v-if="errors.region_id" class="error-message">{{ errors.region_id }}</span>
        </div>

        <div class="form-group">
          <label class="form-label required">Difficulty</label>
          <select
            class="form-select"
            :class="{ 'input-error': errors.difficulty }"
            :value="formData.difficulty ?? ''"
            @change="update('difficulty', ($event.target as HTMLSelectElement).value as Difficulty || null)"
          >
            <option value="">Select difficulty...</option>
            <option v-for="d in difficulties" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
          <span v-if="errors.difficulty" class="error-message">{{ errors.difficulty }}</span>
        </div>
      </div>

      <div class="two-col">
        <div class="form-group">
          <label class="form-label">Latitude</label>
          <input
            type="number"
            class="form-input"
            :class="{ 'input-error': errors.latitude }"
            :value="formData.latitude ?? ''"
            step="0.000001"
            min="-90"
            max="90"
            placeholder="-1.2921"
            @input="update('latitude', ($event.target as HTMLInputElement).value ? parseFloat(($event.target as HTMLInputElement).value) : null)"
          />
          <span v-if="errors.latitude" class="error-message">{{ errors.latitude }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Longitude</label>
          <input
            type="number"
            class="form-input"
            :class="{ 'input-error': errors.longitude }"
            :value="formData.longitude ?? ''"
            step="0.000001"
            min="-180"
            max="180"
            placeholder="36.8219"
            @input="update('longitude', ($event.target as HTMLInputElement).value ? parseFloat(($event.target as HTMLInputElement).value) : null)"
          />
          <span v-if="errors.longitude" class="error-message">{{ errors.longitude }}</span>
        </div>
      </div>
    </template>

    <!-- Meeting point (always shown) -->
    <div class="form-group">
      <label class="form-label">Meeting Point <span class="optional">(optional)</span></label>
      <textarea
        class="form-textarea"
        :value="formData.meeting_point"
        rows="2"
        placeholder="Where participants should meet, e.g. Main gate parking area"
        @input="update('meeting_point', ($event.target as HTMLTextAreaElement).value)"
      />
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

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.optional {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.radio-group {
  display: flex;
  gap: var(--space-6);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.input-error {
  border-color: var(--color-error);
}

.error-message {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
</style>
