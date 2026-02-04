<script setup lang="ts">
import type { Trail } from '@/types/trail'
import TrailStatusBadge from './TrailStatusBadge.vue'
import TrailDifficultyBadge from './TrailDifficultyBadge.vue'

defineProps<{
  trail: Trail
}>()

const emit = defineEmits<{
  click: [trail: Trail]
}>()

function formatDistance(km: number | null): string {
  if (km === null) return '-'
  return `${km} km`
}

function formatDuration(hours: number | null): string {
  if (hours === null) return '-'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours} hr`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="trail-card" @click="emit('click', trail)">
    <div class="card-image">
      <img
        v-if="trail.featured_image?.variants?.medium"
        :src="trail.featured_image.variants.medium"
        :alt="trail.name"
      />
      <div v-else class="image-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3h18v18H3zM8 10l3 3 2-2 4 4M14.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
        </svg>
      </div>
      <div class="card-status">
        <TrailStatusBadge :status="trail.status" />
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ trail.name }}</h3>
      <p v-if="trail.location_name || trail.county" class="card-location">
        {{ trail.location_name }}<span v-if="trail.location_name && trail.county">, </span>{{ trail.county?.name }}
      </p>
      <div class="card-stats">
        <span v-if="trail.distance_km" class="stat">{{ formatDistance(trail.distance_km) }}</span>
        <span v-if="trail.duration_hours" class="stat">{{ formatDuration(trail.duration_hours) }}</span>
        <TrailDifficultyBadge v-if="trail.difficulty" :difficulty="trail.difficulty" />
      </div>
      <div class="card-footer">
        <span v-if="trail.amenities?.length" class="amenity-count">
          {{ trail.amenities.length }} amenities
        </span>
        <span class="card-date">{{ formatDate(trail.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trail-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.trail-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
}

.card-image {
  position: relative;
  height: 180px;
  background: var(--color-background-alt);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

.card-status {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

.card-body {
  padding: var(--space-4);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-location {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3) 0;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.stat {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding: var(--space-1) var(--space-2);
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amenity-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.card-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
</style>
