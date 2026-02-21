<script setup lang="ts">
import type { GroupHikeFormData } from '@/types/groupHike'
import type { User } from '@/types/auth'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  currentUser: User | null
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
}>()

function update(field: keyof GroupHikeFormData, value: unknown) {
  emit('update:formData', { [field]: value })
}

function copyFromProfile() {
  if (!props.currentUser) return
  emit('update:formData', {
    contact_name: props.currentUser.full_name,
    contact_email: props.currentUser.email,
    contact_phone: props.currentUser.phone ?? '',
    contact_whatsapp: props.currentUser.phone ?? '',
  })
}
</script>

<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Contact Information</h3>
      <button
        v-if="currentUser"
        type="button"
        class="btn-link"
        @click="copyFromProfile"
      >
        Copy from profile
      </button>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label class="form-label">Contact Name</label>
        <input
          type="text"
          class="form-input"
          :value="formData.contact_name"
          placeholder="Contact person name"
          @input="update('contact_name', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-input"
          :class="{ 'input-error': errors.contact_email }"
          :value="formData.contact_email"
          placeholder="contact@example.com"
          @input="update('contact_email', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.contact_email" class="error-message">{{ errors.contact_email }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Phone</label>
        <input
          type="tel"
          class="form-input"
          :value="formData.contact_phone"
          placeholder="+254 7XX XXX XXX"
          @input="update('contact_phone', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-group">
        <label class="form-label">WhatsApp</label>
        <input
          type="tel"
          class="form-input"
          :value="formData.contact_whatsapp"
          placeholder="+254 7XX XXX XXX"
          @input="update('contact_whatsapp', ($event.target as HTMLInputElement).value)"
        />
      </div>
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.btn-link:hover {
  color: var(--color-primary-hover);
}

.two-col {
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
