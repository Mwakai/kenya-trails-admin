import { reactive, ref, computed, toRaw, nextTick } from 'vue'
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

  // Laravel returns times as "HH:MM:SS" and dates as "YYYY-MM-DD HH:MM:SS" or ISO strings.
  // HTML inputs require "HH:MM" and "YYYY-MM-DD" respectively.
  function toDateInput(v: string | null | undefined): string {
    if (!v) return ''
    return v.slice(0, 10)
  }
  function toTimeInput(v: string | null | undefined): string {
    if (!v) return ''
    const parts = v.split(':')
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : v
  }

  function populateFromHike(hike: GroupHike) {
    // The API may return data in nested objects (GroupHike type) or flat (like GroupHikeListItem).
    // We check nested first, fall back to top-level flat fields.
    const h = hike as GroupHike & Record<string, any>

    formData.title = hike.title
    formData.slug = hike.slug
    formData.description = hike.description
    formData.short_description = hike.short_description ?? ''
    formData.organizer_id = hike.organizer?.id ?? null
    formData.company_id = hike.company?.id ?? null

    // Location
    formData.location_type = hike.location?.type ?? h.location_type ?? 'trail'
    formData.trail_id = hike.trail?.id ?? null
    const isCustom = formData.location_type === 'custom'
    formData.custom_location_name = isCustom ? (hike.location?.name ?? h.custom_location_name ?? '') : ''
    formData.latitude = hike.location?.latitude ?? h.latitude ?? null
    formData.longitude = hike.location?.longitude ?? h.longitude ?? null
    formData.region_id = hike.location?.region?.id ?? h.region_id ?? null
    formData.meeting_point = hike.meeting_point ?? ''

    // Dates — nested under hike.dates or flat on hike
    formData.start_date = toDateInput(hike.dates?.start_date ?? h.start_date)
    formData.start_time = toTimeInput(hike.dates?.start_time ?? h.start_time)
    formData.is_multi_day = hike.dates?.is_multi_day ?? h.is_multi_day ?? false
    formData.end_date = toDateInput(hike.dates?.end_date ?? h.end_date)
    formData.end_time = toTimeInput(hike.dates?.end_time ?? h.end_time)

    // Capacity
    const rawMax = hike.capacity?.max_participants ?? h.max_participants ?? null
    formData.max_participants = rawMax != null ? Number(rawMax) : null

    // Registration
    formData.registration_url = hike.registration?.url ?? h.registration_url ?? ''
    formData.registration_deadline = toDateInput(hike.registration?.deadline ?? h.registration_deadline)
    formData.registration_notes = hike.registration?.notes ?? h.registration_notes ?? ''

    // Pricing — price may come back as a string from Laravel decimal columns
    formData.is_free = hike.pricing?.is_free ?? h.is_free ?? false
    const rawPrice = hike.pricing?.price ?? h.price ?? null
    formData.price = rawPrice != null ? Number(rawPrice) : null
    formData.price_currency = hike.pricing?.currency ?? h.price_currency ?? 'KES'
    formData.price_notes = hike.pricing?.notes ?? h.price_notes ?? ''

    // Contact
    formData.contact_name = hike.contact?.name ?? h.contact_name ?? ''
    formData.contact_email = hike.contact?.email ?? h.contact_email ?? ''
    formData.contact_phone = hike.contact?.phone ?? h.contact_phone ?? ''
    formData.contact_whatsapp = hike.contact?.whatsapp ?? h.contact_whatsapp ?? ''

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

  function buildPayload(): Record<string, unknown> {
    const raw = toRaw(formData)
    const n = (v: string) => (v === '' ? null : v)
    return {
      ...raw,
      slug: n(raw.slug),
      start_date: n(raw.start_date),
      start_time: n(raw.start_time),
      end_date: n(raw.end_date),
      end_time: n(raw.end_time),
      registration_deadline: n(raw.registration_deadline),
      registration_url: n(raw.registration_url),
    }
  }

  function scrollToFirstError() {
    nextTick(() => {
      const el = document.querySelector<HTMLElement>('.input-error, .error-message')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  async function save(isDraft = false): Promise<GroupHike | null> {
    if (!validate(isDraft)) {
      if (!isDraft) {
        toast.error('Please fix the validation errors before saving')
        scrollToFirstError()
      }
      return null
    }

    isSaving.value = true
    try {
      let hike: GroupHike
      const payload = buildPayload()

      if (isEditMode.value && existingHikeId.value) {
        hike = await store.updateGroupHike(existingHikeId.value, payload as Partial<GroupHikeFormData>)
        toast.success('Group hike updated successfully')
      } else {
        hike = await store.createGroupHike(payload as GroupHikeFormData)
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
