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
  RegionOption,
  RegionListResponse,
} from '@/types/trail'

const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

export const useTrailsStore = defineStore('trails', () => {
  const trails = ref<Trail[]>([])
  const regions = ref<RegionOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  // Cache tracking
  const _initialized = ref(false)
  const _regionsInitialized = ref(false)
  const _lastFetchedAt = ref(0)

  // In-flight deduplication
  let _trailsPromise: Promise<void> | null = null
  let _regionsPromise: Promise<void> | null = null

  async function fetchTrails(filters: TrailFilters = {}, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.per_page) params.append('per_page', String(filters.per_page))
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.region_id) params.append('region_id', String(filters.region_id))
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
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load trails'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureTrails(filters: TrailFilters = {}): Promise<void> {
    if (_initialized.value && trails.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchTrails(filters, { silent: true }).catch(() => {})
      }
      return
    }
    if (_trailsPromise) return _trailsPromise
    _trailsPromise = fetchTrails(filters).finally(() => { _trailsPromise = null })
    return _trailsPromise
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

  async function fetchRegions(): Promise<void> {
    try {
      const response = await api.get<RegionListResponse>('/admin/trails/regions', {
        requiresAuth: true,
      })
      regions.value = response.data.regions
      _regionsInitialized.value = true
    } catch (err) {
      console.error('Failed to load regions:', err)
    }
  }

  async function ensureRegions(): Promise<void> {
    if (_regionsInitialized.value && regions.value.length > 0) return
    if (_regionsPromise) return _regionsPromise
    _regionsPromise = fetchRegions().finally(() => { _regionsPromise = null })
    return _regionsPromise
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    trails.value = []
    regions.value = []
    loading.value = false
    error.value = null
    meta.value = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
    _initialized.value = false
    _regionsInitialized.value = false
    _lastFetchedAt.value = 0
    _trailsPromise = null
    _regionsPromise = null
  }

  return {
    trails,
    regions,
    loading,
    error,
    meta,
    fetchTrails,
    ensureTrails,
    fetchTrail,
    createTrail,
    updateTrail,
    deleteTrail,
    publishTrail,
    unpublishTrail,
    archiveTrail,
    restoreTrail,
    fetchRegions,
    ensureRegions,
    clearError,
    $reset,
  }
})
