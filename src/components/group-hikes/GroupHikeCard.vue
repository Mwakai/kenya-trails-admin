<script setup lang="ts">
import type { GroupHikeListItem } from '@/types/groupHike'
import GroupHikeStatusBadge from './GroupHikeStatusBadge.vue'

defineProps<{
  hike: GroupHikeListItem
}>()

const emit = defineEmits<{
  edit: [hike: GroupHikeListItem]
  view: [hike: GroupHikeListItem]
  publish: [hike: GroupHikeListItem]
  unpublish: [hike: GroupHikeListItem]
  cancel: [hike: GroupHikeListItem]
  delete: [hike: GroupHikeListItem]
}>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="hike-card" :class="{ 'card-past': hike.is_past }">
    <!-- Image -->
    <div class="card-image">
      <img
        v-if="hike.featured_image?.medium"
        :src="hike.featured_image.medium"
        :alt="hike.title"
      />
      <div v-else class="image-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M17 8C8 10 5.9 16.17 3.82 19.15a1 1 0 001.43 1.38A6.84 6.84 0 018.5 19c2 0 3.5 1 6.5 1s5-2 5-7c0-7-3.5-5-3-5z" />
        </svg>
      </div>
      <div class="card-badges">
        <span v-if="hike.is_featured" class="badge-featured">Featured</span>
        <span v-if="hike.is_past" class="badge-past">Past</span>
      </div>
      <GroupHikeStatusBadge class="card-status" :status="hike.status" />
    </div>

    <!-- Content -->
    <div class="card-body">
      <h3 class="card-title">{{ hike.title }}</h3>

      <div class="card-meta">
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{{ hike.start_date ? formatDate(hike.start_date) : '—' }}</span>
        </div>
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{{ hike.location_name }}</span>
        </div>
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{{ hike.organizer?.name ?? '—' }}</span>
        </div>
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span :class="hike.is_free ? 'price-free' : ''">{{ hike.price_formatted ?? '—' }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions">
        <button class="btn btn-sm btn-secondary" @click="emit('view', hike)">View</button>
        <button v-if="hike.can_edit" class="btn btn-sm btn-secondary" @click="emit('edit', hike)">Edit</button>
        <button
          v-if="hike.can_delete"
          class="btn btn-sm btn-danger"
          @click="emit('delete', hike)"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hike-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.hike-card:hover {
  box-shadow: var(--shadow-md);
}

.card-past {
  opacity: 0.7;
}

.card-image {
  position: relative;
  height: 180px;
  background: var(--color-background-alt);
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

.card-badges {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: flex;
  gap: var(--space-1);
}

.badge-featured {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #92400e;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.badge-past {
  display: inline-block;
  padding: 2px 8px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
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
  margin: 0 0 var(--space-3) 0;
  line-height: 1.3;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item svg {
  flex-shrink: 0;
}

.price-free {
  color: #166534;
  font-weight: var(--font-weight-medium);
}

.card-actions {
  display: flex;
  gap: var(--space-2);
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

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
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
