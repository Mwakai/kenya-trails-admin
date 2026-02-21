<script setup lang="ts">
import { ref } from 'vue'
import type { GroupHikeListItem } from '@/types/groupHike'
import GroupHikeStatusBadge from './GroupHikeStatusBadge.vue'

defineProps<{
  hikes: GroupHikeListItem[]
  canPublish?: boolean
}>()

const emit = defineEmits<{
  edit: [hike: GroupHikeListItem]
  view: [hike: GroupHikeListItem]
  publish: [hike: GroupHikeListItem]
  unpublish: [hike: GroupHikeListItem]
  cancel: [hike: GroupHikeListItem]
  delete: [hike: GroupHikeListItem]
}>()

const openActionsId = ref<number | null>(null)

function toggleActions(id: number) {
  openActionsId.value = openActionsId.value === id ? null : id
}

function closeActions() {
  openActionsId.value = null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function handleAction(action: () => void) {
  closeActions()
  action()
}
</script>

<template>
  <div class="table-container" @click="closeActions">
    <table class="hikes-table">
      <thead>
        <tr>
          <th>Hike</th>
          <th>Date</th>
          <th>Location</th>
          <th>Organizer</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="hike in hikes"
          :key="hike.id"
          :class="{ 'row-past': hike.is_past }"
        >
          <!-- Hike -->
          <td class="hike-name-cell">
            <div class="hike-thumb">
              <img
                v-if="hike.featured_image?.thumbnail"
                :src="hike.featured_image.thumbnail"
                :alt="hike.title"
              />
              <div v-else class="thumb-placeholder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.15a1 1 0 001.43 1.38A6.84 6.84 0 018.5 19c2 0 3.5 1 6.5 1s5-2 5-7c0-7-3.5-5-3-5z" />
                </svg>
              </div>
            </div>
            <div>
              <span class="hike-title">{{ hike.title }}</span>
              <div class="hike-badges">
                <span v-if="hike.is_featured" class="badge-featured">Featured</span>
                <span v-if="hike.is_multi_day" class="badge-multiday">Multi-day</span>
              </div>
            </div>
          </td>

          <!-- Date -->
          <td>
            <span class="date-primary">{{ hike.start_date ? formatDate(hike.start_date) : '—' }}</span>
            <span v-if="hike.start_time" class="date-secondary">{{ hike.start_time }}</span>
            <span v-if="hike.end_date" class="date-secondary">→ {{ formatDate(hike.end_date) }}</span>
          </td>

          <!-- Location -->
          <td>
            <span class="location-name">{{ hike.location_name }}</span>
            <span v-if="hike.region?.name" class="location-region">{{ hike.region.name }}</span>
          </td>

          <!-- Organizer -->
          <td>
            <span class="organizer-name">{{ hike.organizer?.name ?? '—' }}</span>
            <span v-if="hike.company?.name" class="organizer-company">{{ hike.company.name }}</span>
          </td>

          <!-- Price -->
          <td>
            <span :class="hike.is_free ? 'price-free' : 'price-paid'">
              {{ hike.price_formatted ?? '—' }}
            </span>
          </td>

          <!-- Status -->
          <td>
            <GroupHikeStatusBadge :status="hike.status" />
          </td>

          <!-- Actions -->
          <td class="actions-cell">
            <div class="actions-wrapper">
              <button class="btn-icon" title="Actions" @click.stop="toggleActions(hike.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              <div v-if="openActionsId === hike.id" class="actions-dropdown" @click.stop>
                <button class="dropdown-item" @click="handleAction(() => emit('view', hike))">
                  View
                </button>
                <button v-if="hike.can_edit" class="dropdown-item" @click="handleAction(() => emit('edit', hike))">
                  Edit
                </button>
                <button
                  v-if="canPublish && hike.can_publish && hike.status === 'draft'"
                  class="dropdown-item"
                  @click="handleAction(() => emit('publish', hike))"
                >
                  Publish
                </button>
                <button
                  v-if="canPublish && hike.status === 'published'"
                  class="dropdown-item"
                  @click="handleAction(() => emit('unpublish', hike))"
                >
                  Unpublish
                </button>
                <button
                  v-if="hike.can_edit && hike.status === 'published'"
                  class="dropdown-item"
                  @click="handleAction(() => emit('cancel', hike))"
                >
                  Cancel
                </button>
                <button
                  v-if="hike.can_delete"
                  class="dropdown-item dropdown-item-danger"
                  @click="handleAction(() => emit('delete', hike))"
                >
                  Delete
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.hikes-table {
  width: 100%;
  border-collapse: collapse;
}

.hikes-table th,
.hikes-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.hikes-table th {
  background: var(--color-background-alt);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hikes-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.hikes-table tbody tr:hover {
  background: var(--color-background-alt);
}

.hikes-table tbody tr:last-child td {
  border-bottom: none;
}

.row-past {
  opacity: 0.6;
}

.hike-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.hike-thumb {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-background-alt);
}

.hike-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

.hike-title {
  display: block;
  font-weight: var(--font-weight-medium);
}

.hike-badges {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.badge-featured {
  display: inline-block;
  padding: 1px 6px;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  border-radius: var(--radius-sm);
}

.badge-multiday {
  display: inline-block;
  padding: 1px 6px;
  background: #ede9fe;
  color: #5b21b6;
  font-size: 10px;
  border-radius: var(--radius-sm);
}

.date-primary {
  display: block;
  font-weight: var(--font-weight-medium);
}

.date-secondary {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.location-name {
  display: block;
  font-weight: var(--font-weight-medium);
}

.location-region {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.organizer-name {
  display: block;
  font-weight: var(--font-weight-medium);
}

.organizer-company {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.price-free {
  color: #166534;
  font-weight: var(--font-weight-medium);
}

.price-paid {
  font-weight: var(--font-weight-medium);
}

.actions-cell {
  position: relative;
}

.actions-wrapper {
  position: relative;
  display: inline-block;
}

.btn-icon {
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.actions-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  min-width: 140px;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border: none;
  background: none;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-background-alt);
}

.dropdown-item-danger {
  color: var(--color-error);
}

.dropdown-item-danger:hover {
  background: var(--color-error-bg);
}
</style>
