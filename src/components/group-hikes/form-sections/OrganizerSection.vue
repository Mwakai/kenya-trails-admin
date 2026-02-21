<script setup lang="ts">
import type { GroupHikeFormData } from '@/types/groupHike'
import type { User } from '@/types/auth'
import CompanySelect from '@/components/companies/CompanySelect.vue'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  currentUser: User | null
  isAdmin: boolean
  organizers?: Array<{ id: number; name: string; email: string }>
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
    <h3 class="section-title">Organizer</h3>

    <!-- Admin view: full organizer select -->
    <template v-if="isAdmin">
      <div class="form-group">
        <label class="form-label">Organizer User <span class="optional">(optional)</span></label>
        <select
          class="form-select"
          :value="formData.organizer_id ?? ''"
          @change="update('organizer_id', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
        >
          <option value="">Select organizer...</option>
          <option
            v-for="org in organizers"
            :key="org.id"
            :value="org.id"
          >
            {{ org.name }} ({{ org.email }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Company <span class="optional">(optional)</span></label>
        <CompanySelect
          :model-value="formData.company_id"
          placeholder="No company"
          @update:model-value="update('company_id', $event)"
        />
      </div>
    </template>

    <!-- Organizer view: self or own company -->
    <template v-else>
      <div v-if="currentUser" class="organizer-info">
        <div class="info-row">
          <span class="info-label">Organizing as:</span>
          <span class="info-value">{{ currentUser.full_name }}</span>
        </div>
        <div v-if="currentUser.company" class="form-group mt-4">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="formData.company_id === currentUser.company.id"
              @change="update('company_id', ($event.target as HTMLInputElement).checked ? currentUser!.company!.id : null)"
            />
            <span>Organize under {{ currentUser.company.name }}</span>
          </label>
        </div>
      </div>
    </template>
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

.form-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.organizer-info {
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.info-row {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.info-label {
  color: var(--color-text-secondary);
}

.info-value {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.mt-4 {
  margin-top: var(--space-4);
}
</style>
