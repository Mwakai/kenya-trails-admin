import { reactive, ref, computed, toRaw } from 'vue'
import { useGroupHikesStore } from '@/stores/groupHikes'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/services/api'
import { validateGroupHike, validateDraftGroupHike } from '@/validation/groupHikeSchemas'
import type { GroupHike, GroupHikeFormData, Difficulty } from '@/types/groupHike'

function createEmptyFormData(): GroupHikeFormData {
  return {
    title: '',
    slug: '',
    description: '',
    short_description: '',
    organizer_id: null,
    company_id: null,
    location_type: 'trail',
    trail_id: null,
    custom_location_name: '',
    latitude: null,
    longitude: null,
    region_id: null,
    meeting_point: '',
    start_date: '',
    start_time: '',
    is_multi_day: false,
    end_date: '',
    end_time: '',
    max_participants: null,
    registration_url: '',
    registration_deadline: '',
    registration_notes: '',
    is_free: false,
    price: null,
    price_currency: 'KES',
    price_notes: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_whatsapp: '',
    difficulty: null,
    featured_image_id: null,
    is_featured: false,
    is_recurring: false,
    recurring_notes: '',
    gallery: [],
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useGroupHikeForm(hikeId?: number) {
  const store = useGroupHikesStore()
  const toast = useToast()

  const formData = reactive<GroupHikeFormData>(createEmptyFormData())
  const errors = ref<Record<string, string>>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const existingHikeId = ref<number | null>(hikeId ?? null)
  let savedSnapshot = ref<string | null>(null)

  const isEditMode = computed(() => existingHikeId.value !== null)

  const isDirty = computed(() => {
    if (!savedSnapshot.value) return false
    return JSON.stringify(toRaw(formData)) !== savedSnapshot.value
  })

  function takeSnapshot() {
    savedSnapshot.value = JSON.stringify(toRaw(formData))
  }

  function populateFromHike(hike: GroupHike) {
    formData.title = hike.title
    formData.slug = hike.slug
    formData.description = hike.description
    formData.short_description = hike.short_description ?? ''
    formData.organizer_id = hike.organizer?.id ?? null
    formData.company_id = hike.company?.id ?? null
    formData.location_type = hike.location?.type ?? 'trail'
    formData.trail_id = hike.trail?.id ?? null
    formData.custom_location_name = hike.location?.type === 'custom' ? (hike.location.name ?? '') : ''
    formData.latitude = hike.location?.latitude ?? null
    formData.longitude = hike.location?.longitude ?? null
    formData.region_id = hike.location?.region?.id ?? null
    formData.meeting_point = hike.meeting_point ?? ''
    formData.start_date = hike.dates?.start_date ?? ''
    formData.start_time = hike.dates?.start_time ?? ''
    formData.is_multi_day = hike.dates?.is_multi_day ?? false
    formData.end_date = hike.dates?.end_date ?? ''
    formData.end_time = hike.dates?.end_time ?? ''
    formData.max_participants = hike.capacity?.max_participants ?? null
    formData.registration_url = hike.registration?.url ?? ''
    formData.registration_deadline = hike.registration?.deadline ?? ''
    formData.registration_notes = hike.registration?.notes ?? ''
    formData.is_free = hike.pricing?.is_free ?? false
    formData.price = hike.pricing?.price ?? null
    formData.price_currency = hike.pricing?.currency ?? 'KES'
    formData.price_notes = hike.pricing?.notes ?? ''
    formData.contact_name = hike.contact?.name ?? ''
    formData.contact_email = hike.contact?.email ?? ''
    formData.contact_phone = hike.contact?.phone ?? ''
    formData.contact_whatsapp = hike.contact?.whatsapp ?? ''
    formData.difficulty = hike.difficulty as Difficulty
    formData.featured_image_id = hike.featured_image?.id ?? null
    formData.is_featured = hike.is_featured
    formData.is_recurring = hike.is_recurring
    formData.recurring_notes = hike.recurring_notes ?? ''
    formData.gallery = (hike.gallery ?? []).map((g) => ({
      media_id: g.media_id,
      caption: g.caption ?? '',
      sort_order: g.sort_order,
    }))
    takeSnapshot()
  }

  async function loadHike(id: number) {
    isLoading.value = true
    try {
      const hike = await store.fetchGroupHike(id)
      existingHikeId.value = id
      populateFromHike(hike)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load group hike')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function onTitleInput() {
    if (!isEditMode.value || !formData.slug) {
      formData.slug = generateSlug(formData.title)
    }
  }

  function validate(isDraft = false): boolean {
    const result = isDraft
      ? validateDraftGroupHike(toRaw(formData))
      : validateGroupHike(toRaw(formData))
    errors.value = result
    return Object.keys(result).length === 0
  }

  async function save(isDraft = false): Promise<GroupHike | null> {
    if (!validate(isDraft)) return null

    isSaving.value = true
    try {
      let hike: GroupHike
      const payload = toRaw(formData)

      if (isEditMode.value && existingHikeId.value) {
        hike = await store.updateGroupHike(existingHikeId.value, payload)
        toast.success('Group hike updated successfully')
      } else {
        hike = await store.createGroupHike(payload)
        existingHikeId.value = hike.id
        toast.success('Group hike created successfully')
      }
      takeSnapshot()
      return hike
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
        if (err.status === 422 && err.data && typeof err.data === 'object') {
          const validationErrors = (err.data as { errors?: Record<string, string[]> }).errors
          if (validationErrors) {
            const mapped: Record<string, string> = {}
            for (const [field, messages] of Object.entries(validationErrors)) {
              mapped[field] = messages[0]
            }
            errors.value = { ...errors.value, ...mapped }
          }
        }
      } else {
        toast.error('Failed to save group hike')
      }
      return null
    } finally {
      isSaving.value = false
    }
  }

  function clearError(field: string) {
    const { [field]: _, ...rest } = errors.value
    errors.value = rest
  }

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    isEditMode,
    isDirty,
    existingHikeId,
    loadHike,
    onTitleInput,
    validate,
    save,
    clearError,
  }
}
