<script setup lang="ts">
import type { GroupHikeFormData } from '@/types/groupHike'

defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  canSetFeatured?: boolean
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Settings</h3>

    <div class="settings-list">
      <!-- Featured -->
      <div v-if="canSetFeatured" class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Featured</span>
          <span class="setting-desc">Show this hike prominently on the site</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="formData.is_featured"
            @change="update('is_featured', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider" />
        </label>
      </div>

      <!-- Recurring -->
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Recurring Hike</span>
          <span class="setting-desc">This hike happens on a recurring schedule</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="formData.is_recurring"
            @change="update('is_recurring', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider" />
        </label>
      </div>
    </div>

    <!-- Recurring notes -->
    <div v-if="formData.is_recurring" class="form-group">
      <label class="form-label required">Recurring Schedule</label>
      <input
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.recurring_notes }"
        :value="formData.recurring_notes"
        placeholder="e.g. Every last Sunday of the month"
        maxlength="255"
        @input="update('recurring_notes', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="errors.recurring_notes" class="error-message">{{ errors.recurring_notes }}</span>
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

.settings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.setting-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--color-border);
  border-radius: 24px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform var(--transition-fast);
}

.toggle input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
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
