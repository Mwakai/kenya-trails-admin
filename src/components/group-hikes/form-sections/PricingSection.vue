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

const currencies = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX']
</script>

<template>
  <div class="form-section">
    <h3 class="section-title">Pricing</h3>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="formData.is_free"
          @change="update('is_free', ($event.target as HTMLInputElement).checked)"
        />
        <span>Free event (no charge)</span>
      </label>
    </div>

    <template v-if="!formData.is_free">
      <div class="price-row">
        <div class="form-group currency-group">
          <label class="form-label required">Currency</label>
          <select
            class="form-select"
            :value="formData.price_currency"
            @change="update('price_currency', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group price-group">
          <label class="form-label required">Price</label>
          <input
            type="number"
            class="form-input"
            :class="{ 'input-error': errors.price }"
            :value="formData.price ?? ''"
            min="0"
            step="0.01"
            placeholder="0.00"
            @input="update('price', ($event.target as HTMLInputElement).value ? parseFloat(($event.target as HTMLInputElement).value) : null)"
          />
          <span v-if="errors.price" class="error-message">{{ errors.price }}</span>
        </div>
      </div>
    </template>

    <div class="form-group">
      <label class="form-label">Price Notes <span class="optional">(optional)</span></label>
      <input
        type="text"
        class="form-input"
        :value="formData.price_notes"
        placeholder="e.g. Includes park fees and guide"
        maxlength="500"
        @input="update('price_notes', ($event.target as HTMLInputElement).value)"
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.price-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--space-3);
}

.currency-group,
.price-group {
  margin-bottom: var(--space-4);
}

.form-input,
.form-select {
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

.form-input:focus,
.form-select:focus {
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
