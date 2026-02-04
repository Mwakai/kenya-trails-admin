<script setup lang="ts">
import { inject, computed } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import RouteForm from '@/components/trails/RouteForm.vue'

const ctx = inject(trailFormKey)!

const errors = computed(() => ctx.stepErrors.value[3] || {})
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Routes</h2>
    <p class="step-subtitle">Define one or two routes for this trail.</p>

    <RouteForm
      label="Route A (Primary)"
      :name="ctx.formData.route_a.name"
      :directions="ctx.formData.route_a.directions"
      :latitude="ctx.formData.route_a.latitude"
      :longitude="ctx.formData.route_a.longitude"
      :image-ids="ctx.formData.route_a.image_ids"
      @update:name="ctx.formData.route_a.name = $event"
      @update:directions="ctx.formData.route_a.directions = $event"
      @update:latitude="ctx.formData.route_a.latitude = $event"
      @update:longitude="ctx.formData.route_a.longitude = $event"
      @update:image-ids="ctx.formData.route_a.image_ids = $event"
    />
    <span v-if="errors['route_a.name']" class="error-msg">{{ errors['route_a.name'] }}</span>

    <div class="route-b-toggle">
      <label class="toggle-label">
        <input
          v-model="ctx.formData.route_b_enabled"
          type="checkbox"
        />
        <span>Add Route B (Alternative Route)</span>
      </label>
    </div>

    <RouteForm
      v-if="ctx.formData.route_b_enabled"
      label="Route B (Alternative)"
      :name="ctx.formData.route_b.name"
      :directions="ctx.formData.route_b.directions"
      :latitude="ctx.formData.route_b.latitude"
      :longitude="ctx.formData.route_b.longitude"
      :image-ids="ctx.formData.route_b.image_ids"
      @update:name="ctx.formData.route_b.name = $event"
      @update:directions="ctx.formData.route_b.directions = $event"
      @update:latitude="ctx.formData.route_b.latitude = $event"
      @update:longitude="ctx.formData.route_b.longitude = $event"
      @update:image-ids="ctx.formData.route_b.image_ids = $event"
    />
    <span v-if="errors['route_b.name']" class="error-msg">{{ errors['route_b.name'] }}</span>
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.step-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.step-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: -12px 0 0 0;
}

.route-b-toggle {
  padding: var(--space-3) 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
}

.toggle-label input {
  accent-color: var(--color-primary);
}

.error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}
</style>
