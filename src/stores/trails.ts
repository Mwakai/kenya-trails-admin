import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/services/api'
import type { PaginationMeta } from '@/types/auth'
import type {
  Trail,
  TrailListResponse,
  TrailResponse,
  TrailDeleteResponse,
  CreateTrailPayload,
  UpdateTrailPayload,
  TrailFilters,
  CountyOption,
  CountyListResponse,
} from '@/types/trail'

export const useTrailsStore = defineStore('trails', () => {
  const trails = ref<Trail[]>([])
  const counties = ref<CountyOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  async function fetchTrails(filters: TrailFilters = {}): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.per_page) params.append('per_page', String(filters.per_page))
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.county_slug) params.append('county_slug', filters.county_slug)
      if (filters.with_deleted) params.append('with_deleted', '1')
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_dir) params.append('sort_dir', filters.sort_dir)

      const queryString = params.toString()
      const endpoint = queryString ? `/admin/trails?${queryString}` : '/admin/trails'

      const response = await api.get<TrailListResponse>(endpoint, {
        requiresAuth: true,
      })
      trails.value = response.data.trails
      if (response.meta) {
        meta.value = response.meta
      }
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load trails'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTrail(id: number): Promise<Trail> {
    const response = await api.get<TrailResponse>(`/admin/trails/${id}`, {
      requiresAuth: true,
    })
    return response.data.trail
  }

  async function createTrail(payload: CreateTrailPayload): Promise<Trail> {
    const response = await api.post<TrailResponse>('/admin/trails', payload, {
      requiresAuth: true,
    })
    return response.data.trail
  }

  async function updateTrail(id: number, payload: UpdateTrailPayload): Promise<Trail> {
    const response = await api.patch<TrailResponse>(`/admin/trails/${id}`, payload, {
      requiresAuth: true,
    })
    const index = trails.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      trails.value[index] = response.data.trail
    }
    return response.data.trail
  }

  async function deleteTrail(id: number): Promise<void> {
    await api.delete<TrailDeleteResponse>(`/admin/trails/${id}`, {
      requiresAuth: true,
    })
    trails.value = trails.value.filter((t) => t.id !== id)
  }

  async function publishTrail(id: number): Promise<Trail> {
    const response = await api.patch<TrailResponse>(`/admin/trails/${id}`, { status: 'published' }, {
      requiresAuth: true,
    })
    const index = trails.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      trails.value[index] = response.data.trail
    }
    return response.data.trail
  }

  async function unpublishTrail(id: number): Promise<Trail> {
    const response = await api.patch<TrailResponse>(`/admin/trails/${id}`, { status: 'draft' }, {
      requiresAuth: true,
    })
    const index = trails.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      trails.value[index] = response.data.trail
    }
    return response.data.trail
  }

  async function archiveTrail(id: number): Promise<Trail> {
    const response = await api.patch<TrailResponse>(`/admin/trails/${id}`, { status: 'archived' }, {
      requiresAuth: true,
    })
    const index = trails.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      trails.value[index] = response.data.trail
    }
    return response.data.trail
  }

  async function restoreTrail(id: number): Promise<Trail> {
    const response = await api.post<TrailResponse>(`/admin/trails/${id}/restore`, {}, {
      requiresAuth: true,
    })
    return response.data.trail
  }

  async function fetchCounties(): Promise<void> {
    try {
      const response = await api.get<CountyListResponse>('/admin/trails/counties', {
        requiresAuth: true,
      })
      const raw = response.data.counties
      const parsed: CountyOption[] = []
      if (raw.popular) {
        for (const [slug, name] of Object.entries(raw.popular)) {
          parsed.push({ slug, name, is_popular: true })
        }
      }
      if (raw.other) {
        for (const [slug, name] of Object.entries(raw.other)) {
          parsed.push({ slug, name, is_popular: false })
        }
      }
      counties.value = parsed
    } catch (err) {
      console.error('Failed to load counties:', err)
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    trails,
    counties,
    loading,
    error,
    meta,
    fetchTrails,
    fetchTrail,
    createTrail,
    updateTrail,
    deleteTrail,
    publishTrail,
    unpublishTrail,
    archiveTrail,
    restoreTrail,
    fetchCounties,
    clearError,
  }
})
