<script setup lang="ts">
import type { GroupHikeStatus } from '@/types/groupHike'

defineProps<{
  status: GroupHikeStatus
}>()

function getStatusClass(status: GroupHikeStatus): string {
  switch (status) {
    case 'published': return 'status-published'
    case 'cancelled': return 'status-cancelled'
    case 'completed': return 'status-completed'
    default: return 'status-draft'
  }
}

function getStatusLabel(status: GroupHikeStatus): string {
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
  background: var(--badge-gray-bg);
  color: var(--badge-gray-text);
}

.status-published {
  background: var(--badge-green-bg);
  color: var(--badge-green-text);
}

.status-cancelled {
  background: var(--badge-red-bg);
  color: var(--badge-red-text);
}

.status-completed {
  background: var(--badge-blue-bg);
  color: var(--badge-blue-text);
}
</style>
