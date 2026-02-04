import { reactive, ref, computed, toRaw } from 'vue'
import type { InjectionKey, Ref, ComputedRef } from 'vue'
import { useTrailsStore } from '@/stores/trails'
import { useStepValidation } from './useStepValidation'
import { stepSchemas, draftSchema } from '@/validation/trailSchemas'
import type {
  TrailFormData,
  Trail,
  CreateTrailPayload,
  UpdateTrailPayload,
} from '@/types/trail'

export const STEP_LABELS = [
  'Basic Info',
  'Trail Stats',
  'Map & Location',
  'Routes',
  'Media',
  'Review',
] as const

function createEmptyFormData(): TrailFormData {
  return {
    name: '',
    short_description: '',
    description: '',
    difficulty: '',
    distance_km: null,
    duration_hours: null,
    elevation_gain_m: null,
    max_altitude_m: null,
    amenity_ids: [],
    latitude: null,
    longitude: null,
    location_name: '',
    county_id: null,
    county_slug: '',
    gpx_file_ids: [],
    route_a: {
      name: '',
      directions: '',
      latitude: null,
      longitude: null,
      image_ids: [],
    },
    route_b_enabled: false,
    route_b: {
      name: '',
      directions: '',
      latitude: null,
      longitude: null,
      image_ids: [],
    },
    featured_image_id: null,
    featured_image: null,
    gallery: [],
    video_url: '',
    publish_status: 'draft',
  }
}

function formDataForStep(step: number, formData: TrailFormData): Record<string, unknown> {
  switch (step) {
    case 0:
      return {
        name: formData.name,
        short_description: formData.short_description,
        description: formData.description,
      }
    case 1:
      return {
        difficulty: formData.difficulty || undefined,
        distance_km: formData.distance_km,
        ...(formData.duration_hours != null && { duration_hours: formData.duration_hours }),
        ...(formData.elevation_gain_m != null && { elevation_gain_m: formData.elevation_gain_m }),
        ...(formData.max_altitude_m != null && { max_altitude_m: formData.max_altitude_m }),
      }
    case 2:
      return {
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_name: formData.location_name,
        ...(formData.county_id != null && { county_id: formData.county_id }),
        county_slug: formData.county_slug,
      }
    case 3:
      return {
        route_a: { ...formData.route_a },
        route_b_enabled: formData.route_b_enabled,
        route_b: { ...formData.route_b },
      }
    case 4:
      return {
        featured_image_id: formData.featured_image_id,
      }
    default:
      return {}
  }
}

function toNumber(val: unknown): number | null {
  if (val == null) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function populateFormFromTrail(formData: TrailFormData, trail: Trail): void {
  formData.name = trail.name
  formData.short_description = trail.short_description || ''
  formData.description = trail.description || ''
  formData.difficulty = trail.difficulty || ''
  formData.distance_km = toNumber(trail.distance_km)
  formData.duration_hours = toNumber(trail.duration_hours)
  formData.elevation_gain_m = toNumber(trail.elevation_gain_m)
  formData.max_altitude_m = toNumber(trail.max_altitude_m)
  formData.amenity_ids = (trail.amenities || []).map((a) => a.id)
  formData.latitude = toNumber(trail.latitude)
  formData.longitude = toNumber(trail.longitude)
  formData.location_name = trail.location_name || ''
  formData.county_id = trail.county_id
  formData.county_slug = trail.county?.slug || ''
  formData.gpx_file_ids = (trail.gpx_files || []).map((g) => g.media_id)
  formData.featured_image_id = trail.featured_image_id
  formData.featured_image = trail.featured_image || null
  formData.gallery = (trail.gallery || []).map((g) => ({
    media_id: g.media_id,
    media: g.media,
    caption: g.caption || '',
    sort_order: g.sort_order,
  }))
  formData.video_url = trail.video_url || ''
  formData.publish_status = trail.status

  if (trail.route_a) {
    formData.route_a = {
      name: trail.route_a.name || '',
      directions: trail.route_a.directions || '',
      latitude: toNumber(trail.route_a.latitude),
      longitude: toNumber(trail.route_a.longitude),
      image_ids: (trail.route_a.images || []).map((i) => i.id),
    }
  }

  if (trail.route_b) {
    formData.route_b_enabled = true
    formData.route_b = {
      name: trail.route_b.name || '',
      directions: trail.route_b.directions || '',
      latitude: toNumber(trail.route_b.latitude),
      longitude: toNumber(trail.route_b.longitude),
      image_ids: (trail.route_b.images || []).map((i) => i.id),
    }
  }
}

function buildPayload(formData: TrailFormData): CreateTrailPayload {
  const payload: CreateTrailPayload = {
    name: formData.name,
    short_description: formData.short_description || undefined,
    description: formData.description || undefined,
    status: formData.publish_status,
    difficulty: formData.difficulty || undefined,
    distance_km: formData.distance_km ?? undefined,
    duration_hours: formData.duration_hours ?? undefined,
    elevation_gain_m: formData.elevation_gain_m ?? undefined,
    max_altitude_m: formData.max_altitude_m ?? undefined,
    latitude: formData.latitude ?? undefined,
    longitude: formData.longitude ?? undefined,
    location_name: formData.location_name || undefined,
    county_id: formData.county_id ?? undefined,
    county_slug: formData.county_slug || undefined,
    video_url: formData.video_url || undefined,
    featured_image_id: formData.featured_image_id ?? undefined,
    amenity_ids: formData.amenity_ids.length > 0 ? formData.amenity_ids : undefined,
    gpx_file_ids: formData.gpx_file_ids.length > 0 ? formData.gpx_file_ids : undefined,
    gallery: formData.gallery.length > 0
      ? formData.gallery.map((g, index) => ({
          media_id: g.media_id,
          caption: g.caption || undefined,
          sort_order: index,
        }))
      : undefined,
  }

  if (formData.route_a.name) {
    payload.route_a = {
      name: formData.route_a.name,
      directions: formData.route_a.directions || undefined,
      latitude: formData.route_a.latitude ?? undefined,
      longitude: formData.route_a.longitude ?? undefined,
      image_ids: formData.route_a.image_ids.length > 0 ? formData.route_a.image_ids : undefined,
    }
  }

  if (formData.route_b_enabled && formData.route_b.name) {
    payload.route_b = {
      name: formData.route_b.name,
      directions: formData.route_b.directions || undefined,
      latitude: formData.route_b.latitude ?? undefined,
      longitude: formData.route_b.longitude ?? undefined,
      image_ids: formData.route_b.image_ids.length > 0 ? formData.route_b.image_ids : undefined,
    }
  }

  return payload
}

export interface CompletionStatus {
  basicInfo: boolean
  stats: boolean
  location: boolean
  routes: boolean
  media: boolean
}

export interface TrailFormContext {
  formData: TrailFormData
  currentStep: Ref<number>
  isEditMode: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isSaving: Ref<boolean>
  stepErrors: Ref<Record<number, Record<string, string>>>
  completionStatus: ComputedRef<CompletionStatus>
  isReadyToPublish: ComputedRef<boolean>
  existingTrailId: Ref<number | null>
  loadTrail: (id: number) => Promise<void>
  nextStep: () => boolean
  prevStep: () => void
  goToStep: (step: number) => void
  save: (publish?: boolean) => Promise<Trail | null>
  validateCurrentStep: () => Record<string, string>
}

export const trailFormKey: InjectionKey<TrailFormContext> = Symbol('trailForm')

export function useTrailForm(trailId?: number) {
  const trailsStore = useTrailsStore()
  const { validate } = useStepValidation()

  const formData = reactive<TrailFormData>(createEmptyFormData())
  const currentStep = ref(0)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const existingTrailId = ref<number | null>(trailId ?? null)
  const stepErrors = ref<Record<number, Record<string, string>>>({})
  const savedSnapshot = ref<string>('')

  const isEditMode = computed(() => existingTrailId.value !== null)

  const isDirty = computed(() => {
    if (!savedSnapshot.value) return false
    return JSON.stringify(toRaw(formData)) !== savedSnapshot.value
  })

  function takeSnapshot() {
    savedSnapshot.value = JSON.stringify(toRaw(formData))
  }

  const completionStatus = computed(() => ({
    basicInfo: !!(formData.name && formData.description),
    stats: !!(formData.difficulty && formData.distance_km),
    location: !!(formData.latitude && formData.longitude && (formData.county_id || formData.county_slug) && formData.location_name),
    routes: !!formData.route_a.name,
    media: !!formData.featured_image_id,
  }))

  const isReadyToPublish = computed(() => {
    const s = completionStatus.value
    return s.basicInfo && s.stats && s.location && s.routes && s.media
  })

  async function loadTrail(id: number): Promise<void> {
    isLoading.value = true
    try {
      const trail = await trailsStore.fetchTrail(id)
      populateFormFromTrail(formData, trail)
      existingTrailId.value = id
      takeSnapshot()
    } finally {
      isLoading.value = false
    }
  }

  function validateCurrentStep(): Record<string, string> {
    const schema = stepSchemas[currentStep.value] ?? null
    const data = formDataForStep(currentStep.value, formData)
    const errors = validate(schema, data)
    stepErrors.value = { ...stepErrors.value, [currentStep.value]: errors }
    return errors
  }

  function nextStep(): boolean {
    const errors = validateCurrentStep()
    if (Object.keys(errors).length > 0) return false
    if (currentStep.value < 5) {
      currentStep.value++
    }
    return true
  }

  function prevStep(): void {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  function goToStep(step: number): void {
    if (step >= 0 && step <= 5) {
      currentStep.value = step
    }
  }

  async function save(publish = false): Promise<Trail | null> {
    if (publish) {
      formData.publish_status = 'published'
    }

    // For drafts only validate name
    if (!publish) {
      const draftErrors = validate(draftSchema, { name: formData.name })
      if (Object.keys(draftErrors).length > 0) {
        stepErrors.value = { ...stepErrors.value, [0]: draftErrors }
        return null
      }
    }

    isSaving.value = true
    try {
      const payload = buildPayload(formData)
      let trail: Trail

      if (isEditMode.value && existingTrailId.value) {
        trail = await trailsStore.updateTrail(existingTrailId.value, payload as UpdateTrailPayload)
      } else {
        trail = await trailsStore.createTrail(payload)
        existingTrailId.value = trail.id
      }

      takeSnapshot()
      return trail
    } finally {
      isSaving.value = false
    }
  }

  // Take initial snapshot for dirty tracking
  takeSnapshot()

  const context: TrailFormContext = {
    formData,
    currentStep,
    isEditMode,
    isDirty,
    isLoading,
    isSaving,
    stepErrors,
    completionStatus,
    isReadyToPublish,
    existingTrailId,
    loadTrail,
    nextStep,
    prevStep,
    goToStep,
    save,
    validateCurrentStep,
  }

  return context
}
