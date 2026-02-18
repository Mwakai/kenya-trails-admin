import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/services/api'
import type {
  Amenity,
  AmenityListResponse,
  AmenityResponse,
  AmenityDeleteResponse,
  CreateAmenityPayload,
  UpdateAmenityPayload,
} from '@/types/auth'

const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

export const useAmenitiesStore = defineStore('amenities', () => {
  const amenities = ref<Amenity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache tracking
  const _initialized = ref(false)
  const _lastFetchedAt = ref(0)

  // In-flight deduplication
  let _promise: Promise<void> | null = null

  async function fetchAmenities(opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const response = await api.get<AmenityListResponse>('/admin/amenities', {
        requiresAuth: true,
      })
      amenities.value = response.data.amenities
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load amenities'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureAmenities(): Promise<void> {
    if (_initialized.value && amenities.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchAmenities({ silent: true }).catch(() => {})
      }
      return
    }
    if (_promise) return _promise
    _promise = fetchAmenities().finally(() => { _promise = null })
    return _promise
  }

  async function fetchAmenity(id: number): Promise<Amenity> {
    const response = await api.get<AmenityResponse>(`/admin/amenities/${id}`, {
      requiresAuth: true,
    })
    return response.data.amenity
  }

  async function createAmenity(payload: CreateAmenityPayload): Promise<Amenity> {
    const response = await api.post<AmenityResponse>('/admin/amenities', payload, {
      requiresAuth: true,
    })
    amenities.value.push(response.data.amenity)
    return response.data.amenity
  }

  async function updateAmenity(id: number, payload: UpdateAmenityPayload): Promise<Amenity> {
    const response = await api.put<AmenityResponse>(`/admin/amenities/${id}`, payload, {
      requiresAuth: true,
    })
    const index = amenities.value.findIndex((a) => a.id === id)
    if (index !== -1) {
      amenities.value[index] = response.data.amenity
    }
    return response.data.amenity
  }

  async function deleteAmenity(id: number): Promise<void> {
    await api.delete<AmenityDeleteResponse>(`/admin/amenities/${id}`, {
      requiresAuth: true,
    })
    amenities.value = amenities.value.filter((a) => a.id !== id)
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    amenities.value = []
    loading.value = false
    error.value = null
    _initialized.value = false
    _lastFetchedAt.value = 0
    _promise = null
  }

  return {
    amenities,
    loading,
    error,
    fetchAmenities,
    ensureAmenities,
    fetchAmenity,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    clearError,
    $reset,
  }
})
