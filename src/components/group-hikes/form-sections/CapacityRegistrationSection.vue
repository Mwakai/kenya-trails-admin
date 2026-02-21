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
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Capacity & Registration</h3>

    <div class="form-group">
      <label class="form-label">Max Participants <span class="optional">(optional)</span></label>
      <input
        type="number"
        class="form-input"
        :class="{ 'input-error': errors.max_participants }"
        :value="formData.max_participants ?? ''"
        min="1"
        placeholder="Leave blank for unlimited"
        @input="update('max_participants', ($event.target as HTMLInputElement).value ? parseInt(($event.target as HTMLInputElement).value) : null)"
      />
      <span v-if="errors.max_participants" class="error-message">{{ errors.max_participants }}</span>
    </div>

    <div class="form-group">
      <label class="form-label">Registration URL <span class="optional">(optional)</span></label>
      <input
        type="url"
        class="form-input"
        :class="{ 'input-error': errors.registration_url }"
        :value="formData.registration_url"
        placeholder="https://..."
        @input="update('registration_url', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="errors.registration_url" class="error-message">{{ errors.registration_url }}</span>
    </div>

    <div class="form-group">
      <label class="form-label">Registration Deadline <span class="optional">(optional)</span></label>
      <input
        type="date"
        class="form-input"
        :class="{ 'input-error': errors.registration_deadline }"
        :value="formData.registration_deadline"
        @change="update('registration_deadline', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="errors.registration_deadline" class="error-message">{{ errors.registration_deadline }}</span>
    </div>

    <div class="form-group">
      <label class="form-label">Registration Notes <span class="optional">(optional)</span></label>
      <textarea
        class="form-textarea"
        :value="formData.registration_notes"
        rows="2"
        placeholder="Any special instructions for registration..."
        @input="update('registration_notes', ($event.target as HTMLTextAreaElement).value)"
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

.optional {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.form-input,
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
</style>
