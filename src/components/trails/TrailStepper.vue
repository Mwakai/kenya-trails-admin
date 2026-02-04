<script setup lang="ts">
import { inject, ref, defineAsyncComponent } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import StepperProgress from '@/components/stepper/StepperProgress.vue'
import StepperNav from '@/components/stepper/StepperNav.vue'

const BasicInfoStep = defineAsyncComponent(() => import('./steps/BasicInfoStep.vue'))
const TrailStatsStep = defineAsyncComponent(() => import('./steps/TrailStatsStep.vue'))
const MapLocationStep = defineAsyncComponent(() => import('./steps/MapLocationStep.vue'))
const RoutesStep = defineAsyncComponent(() => import('./steps/RoutesStep.vue'))
const MediaStep = defineAsyncComponent(() => import('./steps/MediaStep.vue'))
const ReviewStep = defineAsyncComponent(() => import('./steps/ReviewStep.vue'))

const stepComponents = [
  BasicInfoStep,
  TrailStatsStep,
  MapLocationStep,
  RoutesStep,
  MediaStep,
  ReviewStep,
]

const ctx = inject(trailFormKey)!

const emit = defineEmits<{
  cancel: []
  saved: [id: number]
}>()

const showUnsavedModal = ref(false)
const pendingAction = ref<'cancel' | null>(null)

function handleCancel() {
  if (ctx.isDirty.value) {
    pendingAction.value = 'cancel'
    showUnsavedModal.value = true
  } else {
    emit('cancel')
  }
}

function confirmLeave() {
  showUnsavedModal.value = false
  if (pendingAction.value === 'cancel') {
    emit('cancel')
  }
  pendingAction.value = null
}

function cancelLeave() {
  showUnsavedModal.value = false
  pendingAction.value = null
}

async function handleSaveDraft() {
  const trail = await ctx.save(false)
  if (trail) {
    emit('saved', trail.id)
  }
}

async function handlePublish() {
  const trail = await ctx.save(true)
  if (trail) {
    emit('saved', trail.id)
  }
}
</script>

<template>
  <div class="trail-stepper">
    <!-- Loading -->
    <div v-if="ctx.isLoading.value" class="loading-state">
      <div class="spinner" />
      <p>Loading trail...</p>
    </div>

    <template v-else>
      <!-- Progress Bar -->
      <StepperProgress />

      <!-- Step Content -->
      <div class="step-container">
        <KeepAlive>
          <component :is="stepComponents[ctx.currentStep.value]" :key="ctx.currentStep.value" />
        </KeepAlive>
      </div>

      <!-- Navigation -->
      <StepperNav
        @cancel="handleCancel"
        @save-draft="handleSaveDraft"
        @publish="handlePublish"
      />
    </template>

    <!-- Unsaved Changes Modal -->
    <div v-if="showUnsavedModal" class="modal-overlay" @click.self="cancelLeave">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Unsaved Changes</h2>
          <button class="btn-close" @click="cancelLeave">&times;</button>
        </div>
        <div class="modal-body">
          <p>You have unsaved changes. Are you sure you want to leave? Your changes will be lost.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelLeave">Stay</button>
          <button class="btn btn-danger" @click="confirmLeave">Leave</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trail-stepper {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  min-height: 500px;
}

.step-container {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  color: var(--color-text-secondary);
  flex: 1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: var(--space-6);
}

.modal-body p {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
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

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-alt);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}
</style>
