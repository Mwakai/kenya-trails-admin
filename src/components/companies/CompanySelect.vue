<script setup lang="ts">
import { onMounted } from 'vue'
import { useCompaniesStore } from '@/stores/companies'

const props = defineProps<{
  modelValue: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const companiesStore = useCompaniesStore()

onMounted(() => {
  companiesStore.ensureDropdownCompanies()
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = target.value
  emit('update:modelValue', val ? Number(val) : null)
}
</script>

<template>
  <select
    class="company-select"
    :value="modelValue ?? ''"
    @change="handleChange"
  >
    <option value="">{{ placeholder ?? 'Select company' }}</option>
    <option
      v-for="company in companiesStore.dropdownCompanies"
      :key="company.id"
      :value="company.id"
    >
      {{ company.name }}
      <template v-if="company.is_verified"> ✓</template>
    </option>
  </select>
</template>

<style scoped>
.company-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  cursor: pointer;
}

.company-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}
</style>
