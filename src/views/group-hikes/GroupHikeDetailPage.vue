<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupHikesStore } from '@/stores/groupHikes'
import { useAuthStore } from '@/stores/auth'
import { useGroupHikeActions } from '@/composables/useGroupHikeActions'
import { ApiError } from '@/services/api'
import type { GroupHike } from '@/types/groupHike'
import GroupHikeStatusBadge from '@/components/group-hikes/GroupHikeStatusBadge.vue'
import CancelModal from '@/components/group-hikes/modals/CancelModal.vue'
import DeleteConfirmModal from '@/components/group-hikes/modals/DeleteConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const store = useGroupHikesStore()
const authStore = useAuthStore()
const actions = useGroupHikeActions()

const hike = ref<GroupHike | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const showCancelModal = ref(false)
const showDeleteModal = ref(false)

const canPublish = authStore.hasAnyPermission(['group_hikes.publish'])

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

async function handlePublish() {
  if (!hike.value) return
  await actions.publish(hike.value.id, async () => {
    hike.value = await store.fetchGroupHike(hike.value!.id)
  })
}

async function handleUnpublish() {
  if (!hike.value) return
  await actions.unpublish(hike.value.id, async () => {
    hike.value = await store.fetchGroupHike(hike.value!.id)
  })
}

async function handleCancelConfirm(reason: string) {
  if (!hike.value) return
  await actions.cancel(hike.value.id, reason, async () => {
    showCancelModal.value = false
    hike.value = await store.fetchGroupHike(hike.value!.id)
  })
}

async function handleDeleteConfirm() {
  if (!hike.value) return
  await actions.remove(hike.value.id, () => {
    showDeleteModal.value = false
    router.push({ name: 'group-hikes' })
  })
}

onMounted(async () => {
  const id = Number(route.params.id)
  isLoading.value = true
  try {
    hike.value = await store.fetchGroupHike(id)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to load group hike'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="detail-page">
    <!-- Header -->
    <div class="page-header">
      <button class="btn-back" @click="router.push({ name: 'group-hikes' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Group Hikes
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="router.push({ name: 'group-hikes' })">Back to list</button>
    </div>

    <!-- Detail Content -->
    <div v-else-if="hike" class="detail-content">
      <!-- Hero -->
      <div class="detail-hero">
        <div v-if="hike.featured_image" class="hero-image">
          <img :src="hike.featured_image.variants?.large || hike.featured_image.url" :alt="hike.title" />
        </div>
        <div class="hero-body">
          <div class="hero-meta">
            <GroupHikeStatusBadge :status="hike.status" />
            <span v-if="hike.is_featured" class="badge-featured">Featured</span>
            <span v-if="hike.is_past" class="badge-past">Past Event</span>
          </div>
          <h1 class="hero-title">{{ hike.title }}</h1>
          <p class="hero-subtitle">{{ hike.date_display }} · {{ hike.time_display }}</p>
          <p class="hero-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {{ hike.location?.name ?? '—' }}<template v-if="hike.location?.region?.name">, {{ hike.location.region.name }}</template>
          </p>

          <!-- Actions row -->
          <div class="hero-actions">
            <button v-if="hike.can_edit" class="btn btn-secondary" @click="router.push({ name: 'group-hikes-edit', params: { id: hike.id } })">
              Edit
            </button>
            <button
              v-if="canPublish && hike.can_publish && hike.status === 'draft'"
              class="btn btn-primary"
              :disabled="actions.actionLoading.value"
              @click="handlePublish"
            >
              Publish
            </button>
            <button
              v-if="canPublish && hike.status === 'published'"
              class="btn btn-secondary"
              :disabled="actions.actionLoading.value"
              @click="handleUnpublish"
            >
              Unpublish
            </button>
            <button
              v-if="hike.can_edit && hike.status === 'published'"
              class="btn btn-warning"
              @click="showCancelModal = true"
            >
              Cancel Hike
            </button>
            <button
              v-if="hike.can_delete"
              class="btn btn-danger"
              @click="showDeleteModal = true"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="info-grid">
        <!-- Description -->
        <div class="info-card info-card-wide">
          <h3 class="info-card-title">About this Hike</h3>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="description-content" v-html="hike.description" />
        </div>

        <!-- Details -->
        <div class="info-card">
          <h3 class="info-card-title">Details</h3>
          <dl class="detail-list">
            <div class="detail-item">
              <dt>Date</dt>
              <dd>{{ hike.dates?.start_date ? formatDate(hike.dates.start_date) : '—' }}</dd>
            </div>
            <div v-if="hike.dates?.end_date" class="detail-item">
              <dt>End Date</dt>
              <dd>{{ formatDate(hike.dates.end_date) }}</dd>
            </div>
            <div class="detail-item">
              <dt>Time</dt>
              <dd>{{ hike.dates?.start_time ?? '—' }}</dd>
            </div>
            <div class="detail-item">
              <dt>Difficulty</dt>
              <dd class="difficulty-text" :class="`difficulty-${hike.difficulty}`">{{ hike.difficulty_label }}</dd>
            </div>
            <div class="detail-item">
              <dt>Price</dt>
              <dd>{{ hike.pricing?.formatted ?? '—' }}</dd>
            </div>
            <div v-if="hike.capacity?.max_participants" class="detail-item">
              <dt>Capacity</dt>
              <dd>{{ hike.capacity.max_participants }} participants</dd>
            </div>
            <div v-if="hike.meeting_point" class="detail-item">
              <dt>Meeting Point</dt>
              <dd>{{ hike.meeting_point }}</dd>
            </div>
          </dl>
        </div>

        <!-- Organizer -->
        <div class="info-card">
          <h3 class="info-card-title">Organizer</h3>
          <dl class="detail-list">
            <div class="detail-item">
              <dt>Name</dt>
              <dd>{{ hike.organizer?.name ?? '—' }}</dd>
            </div>
            <div v-if="hike.company" class="detail-item">
              <dt>Company</dt>
              <dd>{{ hike.company.name }}</dd>
            </div>
            <div v-if="hike.contact?.name" class="detail-item">
              <dt>Contact</dt>
              <dd>{{ hike.contact.name }}</dd>
            </div>
            <div v-if="hike.contact?.email" class="detail-item">
              <dt>Email</dt>
              <dd>{{ hike.contact.email }}</dd>
            </div>
            <div v-if="hike.contact?.phone" class="detail-item">
              <dt>Phone</dt>
              <dd>{{ hike.contact.phone }}</dd>
            </div>
          </dl>
        </div>

        <!-- Registration -->
        <div v-if="hike.registration?.url || hike.registration?.deadline" class="info-card">
          <h3 class="info-card-title">Registration</h3>
          <dl class="detail-list">
            <div v-if="hike.registration?.deadline" class="detail-item">
              <dt>Deadline</dt>
              <dd>{{ formatDate(hike.registration.deadline) }}</dd>
            </div>
            <div v-if="hike.registration?.url" class="detail-item">
              <dt>Registration URL</dt>
              <dd>
                <a :href="hike.registration.url" target="_blank" rel="noopener" class="link">
                  Register Now
                </a>
              </dd>
            </div>
            <div v-if="hike.registration?.notes" class="detail-item">
              <dt>Notes</dt>
              <dd>{{ hike.registration.notes }}</dd>
            </div>
          </dl>
        </div>

        <!-- Cancellation info -->
        <div v-if="hike.status === 'cancelled'" class="info-card info-card-danger">
          <h3 class="info-card-title">Cancellation</h3>
          <p v-if="hike.cancellation_reason" class="cancellation-reason">
            {{ hike.cancellation_reason }}
          </p>
          <p v-if="hike.cancelled_at" class="cancellation-date">
            Cancelled on {{ formatDate(hike.cancelled_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CancelModal
      v-if="showCancelModal && hike"
      :hike-name="hike.title"
      :loading="actions.actionLoading.value"
      @confirm="handleCancelConfirm"
      @close="showCancelModal = false"
    />

    <DeleteConfirmModal
      v-if="showDeleteModal && hike"
      :hike-name="hike.title"
      :loading="actions.actionLoading.value"
      @confirm="handleDeleteConfirm"
      @close="showDeleteModal = false"
    />
  </div>
</template>

<style scoped>
.detail-page {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-6);
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

.error-state {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  color: var(--color-error);
}

/* Hero */
.detail-hero {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-6);
}

.hero-image {
  height: 280px;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-body {
  padding: var(--space-6);
}

.hero-meta {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.badge-featured {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: #fef3c7;
  color: #92400e;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.badge-past {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: #f3f4f6;
  color: #4b5563;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
}

.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.hero-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-1) 0;
}

.hero-location {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-4) 0;
}

.hero-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}

.info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.info-card-wide {
  grid-column: 1 / -1;
}

.info-card-danger {
  border-color: var(--color-error-border);
  background: var(--color-error-bg);
}

.info-card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4) 0;
}

.description-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.7;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--space-2);
}

.detail-item dt {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.detail-item dd {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  margin: 0;
}

.difficulty-text {
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
}

.difficulty-easy { color: #166534; }
.difficulty-moderate { color: #1e40af; }
.difficulty-difficult { color: #9a3412; }
.difficulty-expert { color: #991b1b; }

.cancellation-reason {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  margin: 0 0 var(--space-2) 0;
}

.cancellation-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Buttons */
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

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
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

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-card-wide {
    grid-column: auto;
  }
}
</style>
