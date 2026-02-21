<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/services/api'
import type { CompanyFormData } from '@/types/company'
import type { Media } from '@/types/auth'
import MediaPickerSingle from '@/components/media/MediaPickerSingle.vue'

const route = useRoute()
const router = useRouter()
const store = useCompaniesStore()
const toast = useToast()

const companyId = route.params.id ? Number(route.params.id) : null
const isEditMode = !!companyId
const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const logoMedia = ref<Media | null>(null)
const coverMedia = ref<Media | null>(null)

const formData = reactive<CompanyFormData>({
  name: '',
  slug: '',
  description: '',
  logo_id: null,
  cover_image_id: null,
  website: '',
  email: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  is_verified: false,
  is_active: true,
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function onNameInput() {
  if (!isEditMode || !formData.slug) {
    formData.slug = generateSlug(formData.name)
  }
}

function handleLogoSelect(media: Media) {
  logoMedia.value = media
  formData.logo_id = media.id
}

function handleLogoRemove() {
  logoMedia.value = null
  formData.logo_id = null
}

function handleCoverSelect(media: Media) {
  coverMedia.value = media
  formData.cover_image_id = media.id
}

function handleCoverRemove() {
  coverMedia.value = null
  formData.cover_image_id = null
}

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!formData.name.trim()) errs.name = 'Company name is required'
  if (!formData.slug.trim()) errs.slug = 'Slug is required'
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errs.email = 'Must be a valid email'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSave() {
  if (!validate()) return
  isSaving.value = true
  try {
    if (isEditMode && companyId) {
      await store.updateCompany(companyId, formData)
      toast.success('Company updated successfully')
    } else {
      await store.createCompany(formData)
      toast.success('Company created successfully')
    }
    router.push({ name: 'companies' })
  } catch (err) {
    if (err instanceof ApiError) {
      toast.error(err.message)
    } else {
      toast.error('Failed to save company')
    }
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (isEditMode && companyId) {
    isLoading.value = true
    try {
      const company = await store.fetchCompany(companyId)
      formData.name = company.name
      formData.slug = company.slug
      formData.description = company.description ?? ''
      formData.logo_id = company.logo?.id ?? null
      formData.cover_image_id = company.cover_image?.id ?? null
      formData.website = company.website ?? ''
      formData.email = company.email ?? ''
      formData.phone = company.phone ?? ''
      formData.whatsapp = company.whatsapp ?? ''
      formData.instagram = company.instagram ?? ''
      formData.facebook = company.facebook ?? ''
      formData.is_verified = company.is_verified
      formData.is_active = company.is_active
      logoMedia.value = company.logo
      coverMedia.value = company.cover_image
    } catch (err) {
      toast.error('Failed to load company')
      router.push({ name: 'companies' })
    } finally {
      isLoading.value = false
    }
  }
})
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <button class="btn-back" @click="router.push({ name: 'companies' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Companies
      </button>
      <h1>{{ isEditMode ? 'Edit Company' : 'Add Company' }}</h1>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner" />
      <p>Loading...</p>
    </div>

    <form v-else class="form-layout" @submit.prevent="handleSave">
      <div class="form-main">
        <!-- Basic Info -->
        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>

          <div class="form-group">
            <label class="form-label required">Company Name</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              @input="onNameInput"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label required">Slug</label>
            <input
              v-model="formData.slug"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.slug }"
            />
            <span v-if="errors.slug" class="error-message">{{ errors.slug }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              rows="4"
              placeholder="Brief description of the company..."
            />
          </div>
        </div>

        <!-- Contact -->
        <div class="form-section">
          <h3 class="section-title">Contact & Links</h3>

          <div class="two-col">
            <div class="form-group">
              <label class="form-label">Website</label>
              <input v-model="formData.website" type="url" class="form-input" placeholder="https://" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="form-input"
                :class="{ 'input-error': errors.email }"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input v-model="formData.phone" type="tel" class="form-input" placeholder="+254..." />
            </div>
            <div class="form-group">
              <label class="form-label">WhatsApp</label>
              <input v-model="formData.whatsapp" type="tel" class="form-input" placeholder="+254..." />
            </div>
            <div class="form-group">
              <label class="form-label">Instagram</label>
              <input v-model="formData.instagram" type="text" class="form-input" placeholder="@handle" />
            </div>
            <div class="form-group">
              <label class="form-label">Facebook</label>
              <input v-model="formData.facebook" type="text" class="form-input" placeholder="page/url" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="form-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-actions">
            <button type="submit" class="btn btn-primary btn-block" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : (isEditMode ? 'Update Company' : 'Create Company') }}
            </button>
            <button type="button" class="btn btn-secondary btn-block" @click="router.push({ name: 'companies' })">
              Cancel
            </button>
          </div>
        </div>

        <!-- Logo -->
        <div class="sidebar-card">
          <h4 class="sidebar-card-title">Logo</h4>
          <MediaPickerSingle
            :media="logoMedia"
            @select="handleLogoSelect"
            @remove="handleLogoRemove"
          />
        </div>

        <!-- Cover Image -->
        <div class="sidebar-card">
          <h4 class="sidebar-card-title">Cover Image</h4>
          <MediaPickerSingle
            :media="coverMedia"
            @select="handleCoverSelect"
            @remove="handleCoverRemove"
          />
        </div>

        <!-- Settings -->
        <div class="sidebar-card">
          <h4 class="sidebar-card-title">Settings</h4>
          <div class="settings-list">
            <label class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Verified</span>
                <span class="setting-desc">Show verified badge</span>
              </div>
              <input v-model="formData.is_verified" type="checkbox" />
            </label>
            <label class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Active</span>
                <span class="setting-desc">Company is active</span>
              </div>
              <input v-model="formData.is_active" type="checkbox" />
            </label>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-page {
  padding: var(--space-6);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
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

.form-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
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

.form-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-5) 0;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: var(--space-4);
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

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
}

.form-input:focus,
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

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
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

.settings-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.setting-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
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
