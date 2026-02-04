<script setup lang="ts">
import { inject } from 'vue'
import { trailFormKey, STEP_LABELS } from '@/composables/useTrailForm'

const ctx = inject(trailFormKey)!
</script>

<template>
  <div class="stepper-progress">
    <div
      v-for="(label, index) in STEP_LABELS"
      :key="index"
      class="step-item"
      :class="{
        active: ctx.currentStep.value === index,
        completed: index < ctx.currentStep.value,
        clickable: index < ctx.currentStep.value,
      }"
      @click="index < ctx.currentStep.value ? ctx.goToStep(index) : undefined"
    >
      <div class="step-circle">
        <svg
          v-if="index < ctx.currentStep.value"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <span class="step-label">{{ label }}</span>
      <div v-if="index < STEP_LABELS.length - 1" class="step-line" />
    </div>
  </div>
</template>

<style scoped>
.stepper-progress {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  overflow-x: auto;
}

.step-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-2);
}

.step-item.clickable {
  cursor: pointer;
}

.step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.step-item.active .step-circle {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.step-item.completed .step-circle {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.step-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.step-item.active .step-label {
  color: var(--color-primary);
}

.step-item.completed .step-label {
  color: var(--color-text-primary);
}

.step-line {
  width: 32px;
  height: 2px;
  background: var(--color-border);
  margin: 0 var(--space-2);
  flex-shrink: 0;
}

.step-item.completed .step-line {
  background: var(--color-primary);
}

@media (max-width: 768px) {
  .step-label {
    display: none;
  }

  .step-line {
    width: 24px;
  }
}
</style>
