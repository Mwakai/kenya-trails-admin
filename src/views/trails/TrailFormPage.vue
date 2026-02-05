<script setup lang="ts">
import { provide, onMounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useTrailForm, trailFormKey } from '@/composables/useTrailForm'
import TrailStepper from '@/components/trails/TrailStepper.vue'

const route = useRoute()
const router = useRouter()

const trailId = route.params.id ? Number(route.params.id) : undefined
const ctx = useTrailForm(trailId)

provide(trailFormKey, ctx)

onMounted(async () => {
  if (trailId) {
    await ctx.loadTrail(trailId)
  }
})

// After first create save, switch to edit mode URL
watch(
  () => ctx.existingTrailId.value,
  (newId, oldId) => {
    if (newId && !oldId && !trailId) {
      router.replace({ name: 'trails-edit', params: { id: newId } })
    }
  },
)

onBeforeRouteLeave((_to, _from, next) => {
  if (ctx.isDirty.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!answer) {
      next(false)
      return
    }
  }
  next()
})

function handleCancel() {
  router.push({ name: 'trails' })
}

function handleSaved(id: number) {
  if (!trailId) {
    // First save in create mode - URL already updated by watcher
    return
  }
  // If trail was just published, go back to the list
  if (ctx.formData.publish_status === 'published') {
    router.push({ name: 'trails' })
    return
  }
  // In edit mode, just stay on the page (data is saved)
  void id
}
</script>

<template>
  <div class="trail-form-page">
    <div class="page-header">
      <button class="back-btn" @click="handleCancel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Trails
      </button>
      <h1>{{ ctx.isEditMode.value ? 'Edit Trail' : 'Create Trail' }}</h1>
    </div>

    <TrailStepper @cancel="handleCancel" @saved="handleSaved" />
  </div>
</template>

<style scoped>
.trail-form-page {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-4);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: color var(--transition-fast);
  margin-bottom: var(--space-3);
}

.back-btn:hover {
  color: var(--color-primary);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
</style>
