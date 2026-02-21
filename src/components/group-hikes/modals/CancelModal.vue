<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  hikeName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [reason: string]
  close: []
}>()

const reason = ref('')
const reasonError = ref('')

function handleConfirm() {
  if (!reason.value.trim()) {
    reasonError.value = 'Cancellation reason is required'
    return
  }
  reasonError.value = ''
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal modal-sm">
      <div class="modal-header">
        <h2>Cancel Group Hike</h2>
        <button class="btn-close" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <p class="warning-text">
          You are about to cancel <strong>{{ hikeName }}</strong>. This will be visible to all participants.
        </p>
        <div class="form-group">
          <label class="form-label required">Cancellation Reason</label>
          <textarea
            v-model="reason"
            class="form-textarea"
            :class="{ 'input-error': reasonError }"
            rows="3"
            placeholder="Explain why this hike is being cancelled..."
            @input="reasonError = ''"
          />
          <span v-if="reasonError" class="error-message">{{ reasonError }}</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" :disabled="loading" @click="emit('close')">Back</button>
        <button class="btn btn-danger" :disabled="loading" @click="handleConfirm">
          {{ loading ? 'Cancelling...' : 'Cancel Hike' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}

.modal-sm {
  max-width: 480px;
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

.modal-body {
  padding: var(--space-6);
}

.warning-text {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-4) 0;
  line-height: 1.6;
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

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
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

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-alt);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: var(--color-text-primary);
}
</style>
