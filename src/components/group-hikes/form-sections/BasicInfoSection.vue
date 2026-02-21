<script setup lang="ts">
import type { GroupHikeFormData } from '@/types/groupHike'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
}>()

const emit = defineEmits<{
  titleInput: []
  'update:formData': [data: Partial<GroupHikeFormData>]
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Basic Information</h3>

    <!-- Title -->
    <div class="form-group">
      <label class="form-label required">Title</label>
      <input
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.title }"
        :value="formData.title"
        placeholder="e.g. Mt. Kenya Summit Hike - March 2026"
        @input="update('title', ($event.target as HTMLInputElement).value); emit('titleInput')"
      />
      <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
    </div>

    <!-- Slug -->
    <div class="form-group">
      <label class="form-label">Slug</label>
      <input
        type="text"
        class="form-input"
        :class="{ 'input-error': errors.slug }"
        :value="formData.slug"
        placeholder="auto-generated from title"
        @input="update('slug', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="errors.slug" class="error-message">{{ errors.slug }}</span>
      <p class="form-hint">Leave blank to auto-generate from title</p>
    </div>

    <!-- Short Description -->
    <div class="form-group">
      <label class="form-label">Short Description</label>
      <textarea
        class="form-textarea"
        :class="{ 'input-error': errors.short_description }"
        :value="formData.short_description"
        rows="2"
        placeholder="Brief summary shown in listings (max 500 chars)"
        maxlength="500"
        @input="update('short_description', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="input-footer">
        <span v-if="errors.short_description" class="error-message">{{ errors.short_description }}</span>
        <span class="char-count">{{ formData.short_description.length }}/500</span>
      </div>
    </div>

    <!-- Description -->
    <div class="form-group">
      <label class="form-label required">Description</label>
      <textarea
        class="form-textarea"
        :class="{ 'input-error': errors.description }"
        :value="formData.description"
        rows="6"
        placeholder="Full description of the hike..."
        @input="update('description', ($event.target as HTMLTextAreaElement).value)"
      />
      <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
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

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0 0;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: var(--space-1);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-left: auto;
}
</style>
