<script setup lang="ts">
import type { TrailDifficulty } from '@/types/trail'

defineProps<{
  difficulty: TrailDifficulty
}>()

function getDifficultyClass(difficulty: TrailDifficulty): string {
  switch (difficulty) {
    case 'easy': return 'difficulty-easy'
    case 'moderate': return 'difficulty-moderate'
    case 'difficult': return 'difficulty-difficult'
    case 'expert': return 'difficulty-expert'
    default: return ''
  }
}

function getDifficultyLabel(difficulty: TrailDifficulty): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}
</script>

<template>
  <span class="difficulty-badge" :class="getDifficultyClass(difficulty)">
    {{ getDifficultyLabel(difficulty) }}
  </span>
</template>

<style scoped>
.difficulty-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.difficulty-easy {
  background: var(--badge-green-bg);
  color: var(--badge-green-text);
}

.difficulty-moderate {
  background: var(--badge-blue-bg);
  color: var(--badge-blue-text);
}

.difficulty-difficult {
  background: var(--badge-orange-bg);
  color: var(--badge-orange-text);
}

.difficulty-expert {
  background: var(--badge-red-bg);
  color: var(--badge-red-text);
}
</style>
