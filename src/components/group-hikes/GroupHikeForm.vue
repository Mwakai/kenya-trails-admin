<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTrailsStore } from '@/stores/trails'
import type { GroupHikeFormData, GroupHikeTrail, Difficulty } from '@/types/groupHike'
import type { Media } from '@/types/auth'
import BasicInfoSection from './form-sections/BasicInfoSection.vue'
import LocationSection from './form-sections/LocationSection.vue'
import DateTimeSection from './form-sections/DateTimeSection.vue'
import CapacityRegistrationSection from './form-sections/CapacityRegistrationSection.vue'
import PricingSection from './form-sections/PricingSection.vue'
import ContactSection from './form-sections/ContactSection.vue'
import OrganizerSection from './form-sections/OrganizerSection.vue'
import MediaSection from './form-sections/MediaSection.vue'
import SettingsSection from './form-sections/SettingsSection.vue'

const props = defineProps<{
  formData: GroupHikeFormData
  errors: Record<string, string>
  isSaving: boolean
  isEditMode: boolean
  organizers?: Array<{ id: number; name: string; email: string }>
}>()

const emit = defineEmits<{
  'update:formData': [data: Partial<GroupHikeFormData>]
  titleInput: []
  save: []
  'save-draft': []
}>()

const authStore = useAuthStore()
const trailsStore = useTrailsStore()

const currentUser = computed(() => authStore.user)
const isAdmin = computed(() => authStore.hasAnyPermission(['group_hikes.view_all']))
const canSetFeatured = computed(() => authStore.hasAnyPermission(['group_hikes.view_all', 'group_hikes.*']))

// Featured image state tracked locally - ID is stored in formData
const featuredImage = ref<Media | null>(null)

const trailsList = computed(() =>
  trailsStore.trails.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    difficulty: t.difficulty as Difficulty,
  }))
)

const regions = computed(() =>
  trailsStore.regions.map((r) => ({ id: r.id, name: r.name }))
)

function handleFormUpdate(patch: Partial<GroupHikeFormData>) {
  emit('update:formData', patch)
}

function handleFeaturedImageSelect(media: Media) {
  featuredImage.value = media
  emit('update:formData', { featured_image_id: media.id })
}

function handleFeaturedImageRemove() {
  featuredImage.value = null
  emit('update:formData', { featured_image_id: null })
}
</script>

<template>
  <div class="form-layout">
    <!-- Main content -->
    <div class="form-main">
      <BasicInfoSection
        :form-data="formData"
        :errors="errors"
        @update:form-data="handleFormUpdate"
        @title-input="emit('titleInput')"
      />

      <LocationSection
        :form-data="formData"
        :errors="errors"
        :regions="regions"
        :trails="trailsList"
        @update:form-data="handleFormUpdate"
      />

      <DateTimeSection
        :form-data="formData"
        :errors="errors"
        @update:form-data="handleFormUpdate"
      />

      <CapacityRegistrationSection
        :form-data="formData"
        :errors="errors"
        @update:form-data="handleFormUpdate"
      />

      <PricingSection
        :form-data="formData"
        :errors="errors"
        @update:form-data="handleFormUpdate"
      />

      <ContactSection
        :form-data="formData"
        :errors="errors"
        :current-user="currentUser"
        @update:form-data="handleFormUpdate"
      />
    </div>

    <!-- Sidebar -->
    <div class="form-sidebar">
      <!-- Publish actions -->
      <div class="sidebar-card">
        <h4 class="sidebar-card-title">Publish</h4>
        <div class="sidebar-actions">
          <button
            class="btn btn-secondary btn-block"
            :disabled="isSaving"
            @click="emit('save-draft')"
          >
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </button>
          <button
            class="btn btn-primary btn-block"
            :disabled="isSaving"
            @click="emit('save')"
          >
            {{ isSaving ? 'Saving...' : (isEditMode ? 'Update Hike' : 'Create Hike') }}
          </button>
        </div>
      </div>

      <!-- Organizer -->
      <OrganizerSection
        :form-data="formData"
        :errors="errors"
        :current-user="currentUser"
        :is-admin="isAdmin"
        :organizers="organizers"
        @update:form-data="handleFormUpdate"
      />

      <!-- Media -->
      <MediaSection
        :form-data="formData"
        :errors="errors"
        :featured-image="featuredImage"
        @update:form-data="handleFormUpdate"
        @featured-image-select="handleFeaturedImageSelect"
        @featured-image-remove="handleFeaturedImageRemove"
      />

      <!-- Settings -->
      <SettingsSection
        :form-data="formData"
        :errors="errors"
        :can-set-featured="canSetFeatured"
        @update:form-data="handleFormUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.form-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-6);
  align-items: start;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: sticky;
  top: var(--space-6);
}

.sidebar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.sidebar-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3) 0;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
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

.btn-block {
  width: 100%;
  text-align: center;
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

@media (max-width: 1024px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    position: static;
  }
}
</style>
