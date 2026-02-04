<script setup lang="ts">
import type { TrailStatus } from '@/types/trail'

defineProps<{
  status: TrailStatus
}>()

function getStatusClass(status: TrailStatus): string {
  switch (status) {
    case 'published': return 'status-published'
    case 'archived': return 'status-archived'
    default: return 'status-draft'
  }
}

function getStatusLabel(status: TrailStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<template>
  <span class="status-badge" :class="getStatusClass(status)">
    {{ getStatusLabel(status) }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
  white-space: nowrap;
}

.status-draft {
  background: #f3f4f6;
  color: #4b5563;
}

.status-published {
  background: #dcfce7;
  color: #166534;
}

.status-archived {
  background: #fef3c7;
  color: #92400e;
}
</style>
