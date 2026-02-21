<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useGroupHikeForm } from '@/composables/useGroupHikeForm'
import { useGroupHikesStore } from '@/stores/groupHikes'
import { useTrailsStore } from '@/stores/trails'
import { useGroupHikeActions } from '@/composables/useGroupHikeActions'
import GroupHikeForm from '@/components/group-hikes/GroupHikeForm.vue'

const route = useRoute()
const router = useRouter()
const trailsStore = useTrailsStore()

const hikeId = route.params.id ? Number(route.params.id) : undefined
const {
  formData,
  errors,
  isLoading,
  isSaving,
  isEditMode,
  isDirty,
  loadHike,
  onTitleInput,
  save,
} = useGroupHikeForm(hikeId)

const pageTitle = computed(() => isEditMode.value ? 'Edit Group Hike' : 'Create Group Hike')

async function handleSave() {
  const hike = await save(false)
  if (hike && !isEditMode.value) {
    router.push({ name: 'group-hike-detail', params: { id: hike.id } })
  }
}

async function handleSaveDraft() {
  const hike = await save(true)
  if (hike && !isEditMode.value) {
    router.push({ name: 'group-hikes-edit', params: { id: hike.id } })
  }
}

function handleFormUpdate(patch: Partial<typeof formData>) {
  Object.assign(formData, patch)
}

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return window.confirm('You have unsaved changes. Leave anyway?')
  }
})

onMounted(async () => {
  await Promise.all([
    trailsStore.ensureTrails(),
    trailsStore.ensureRegions(),
  ])
  if (hikeId) {
    await loadHike(hikeId)
  }
})
</script>

<template>
  <div class="form-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="router.back()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <h1>{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Loading (edit mode) -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading group hike...</p>
    </div>

    <!-- Form -->
    <GroupHikeForm
      v-else
      :form-data="formData"
      :errors="errors"
      :is-saving="isSaving"
      :is-edit-mode="isEditMode"
      @update:form-data="handleFormUpdate"
      @title-input="onTitleInput"
      @save="handleSave"
      @save-draft="handleSaveDraft"
    />
  </div>
</template>

<style scoped>
.form-page {
  padding: var(--space-6);
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-6);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  color: var(--color-text-secondary);
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
</style>
