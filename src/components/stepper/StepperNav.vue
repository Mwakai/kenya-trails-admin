<script setup lang="ts">
import { inject } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'

const ctx = inject(trailFormKey)!

const emit = defineEmits<{
  cancel: []
  'save-draft': []
  publish: []
}>()
</script>

<template>
  <div class="stepper-nav">
    <div class="nav-left">
      <button class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
      <button
        v-if="ctx.currentStep.value > 0"
        class="btn btn-secondary"
        @click="ctx.prevStep()"
      >
        Previous
      </button>
    </div>
    <div class="nav-right">
      <button
        class="btn btn-secondary"
        :disabled="ctx.isSaving.value"
        @click="emit('save-draft')"
      >
        {{ ctx.isSaving.value ? 'Saving...' : 'Save Draft' }}
      </button>
      <button
        v-if="ctx.currentStep.value < 5"
        class="btn btn-primary"
        @click="ctx.nextStep()"
      >
        Next
      </button>
      <button
        v-else
        class="btn btn-primary"
        :disabled="!ctx.isReadyToPublish.value || ctx.isSaving.value"
        @click="emit('publish')"
      >
        {{ ctx.isSaving.value ? 'Publishing...' : 'Publish Trail' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.nav-left,
.nav-right {
  display: flex;
  gap: var(--space-3);
}

.btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-alt);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
