<script setup lang="ts">
import type { GroupHikeFormData } from '@/types/groupHike'

defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Date & Time</h3>

    <!-- Multi-day toggle -->
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="formData.is_multi_day"
          @change="update('is_multi_day', ($event.target as HTMLInputElement).checked)"
        />
        <span>Multi-day hike</span>
      </label>
    </div>

    <div class="date-grid">
      <!-- Start Date -->
      <div class="form-group">
        <label class="form-label required">Start Date</label>
        <input
          type="date"
          class="form-input"
          :class="{ 'input-error': errors.start_date }"
          :value="formData.start_date"
          :min="todayDate()"
          @change="update('start_date', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.start_date" class="error-message">{{ errors.start_date }}</span>
      </div>

      <!-- Start Time -->
      <div class="form-group">
        <label class="form-label required">Start Time</label>
        <input
          type="time"
          class="form-input"
          :class="{ 'input-error': errors.start_time }"
          :value="formData.start_time"
          @change="update('start_time', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.start_time" class="error-message">{{ errors.start_time }}</span>
      </div>

      <!-- End Date (multi-day only) -->
      <template v-if="formData.is_multi_day">
        <div class="form-group">
          <label class="form-label required">End Date</label>
          <input
            type="date"
            class="form-input"
            :class="{ 'input-error': errors.end_date }"
            :value="formData.end_date"
            :min="formData.start_date || todayDate()"
            @change="update('end_date', ($event.target as HTMLInputElement).value)"
          />
          <span v-if="errors.end_date" class="error-message">{{ errors.end_date }}</span>
        </div>

        <!-- End Time -->
        <div class="form-group">
          <label class="form-label">End Time <span class="optional">(optional)</span></label>
          <input
            type="time"
            class="form-input"
            :value="formData.end_time"
            @change="update('end_time', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>
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

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  margin-bottom: 0;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
  margin-bottom: var(--space-4);
}

.form-input {
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

.form-input:focus {
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
</style>
