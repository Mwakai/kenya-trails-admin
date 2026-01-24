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

export const useAmenitiesStore = defineStore('amenities', () => {
  const amenities = ref<Amenity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAmenities(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<AmenityListResponse>('/admin/amenities', {
        requiresAuth: true,
      })
      amenities.value = response.data.amenities
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load amenities'
      throw err
    } finally {
      loading.value = false
    }
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

  return {
    amenities,
    loading,
    error,
    fetchAmenities,
    fetchAmenity,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    clearError,
  }
})
