import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/services/api'
import { groupHikeService } from '@/services/groupHikeService'
import type { GroupHike, GroupHikeListItem, GroupHikeFormData, GroupHikeFilters } from '@/types/groupHike'
import type { PaginationMeta } from '@/types/auth'

const STALE_AFTER_MS = 5 * 60 * 1000

export const useGroupHikesStore = defineStore('groupHikes', () => {
  const groupHikes = ref<GroupHikeListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  const _initialized = ref(false)
  const _lastFetchedAt = ref(0)
  let _hikesPromise: Promise<void> | null = null

  async function fetchGroupHikes(filters: Partial<GroupHikeFilters> = {}, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const result = await groupHikeService.list(filters)
      groupHikes.value = result.items ?? []
      if (result.meta) {
        meta.value = result.meta
      }
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load group hikes'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureGroupHikes(filters: Partial<GroupHikeFilters> = {}): Promise<void> {
    if (_initialized.value && groupHikes.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchGroupHikes(filters, { silent: true }).catch(() => {})
      }
      return
    }
    if (_hikesPromise) return _hikesPromise
    _hikesPromise = fetchGroupHikes(filters).finally(() => { _hikesPromise = null })
    return _hikesPromise
  }

  async function fetchGroupHike(id: number): Promise<GroupHike> {
    return groupHikeService.get(id)
  }

  async function createGroupHike(data: GroupHikeFormData): Promise<GroupHike> {
    return groupHikeService.create(data)
  }

  async function updateGroupHike(id: number, data: Partial<GroupHikeFormData>): Promise<GroupHike> {
    const hike = await groupHikeService.update(id, data)
    const index = groupHikes.value.findIndex((h) => h.id === id)
    if (index !== -1) {
      groupHikes.value[index] = {
        ...groupHikes.value[index],
        title: hike.title,
        status: hike.status,
        status_label: hike.status_label,
        is_featured: hike.is_featured,
      }
    }
    return hike
  }

  async function deleteGroupHike(id: number): Promise<void> {
    await groupHikeService.delete(id)
    groupHikes.value = groupHikes.value.filter((h) => h.id !== id)
  }

  async function publishGroupHike(id: number): Promise<GroupHike> {
    const hike = await groupHikeService.publish(id)
    const index = groupHikes.value.findIndex((h) => h.id === id)
    if (index !== -1) {
      groupHikes.value[index] = { ...groupHikes.value[index], status: hike.status, status_label: hike.status_label }
    }
    return hike
  }

  async function unpublishGroupHike(id: number): Promise<GroupHike> {
    const hike = await groupHikeService.unpublish(id)
    const index = groupHikes.value.findIndex((h) => h.id === id)
    if (index !== -1) {
      groupHikes.value[index] = { ...groupHikes.value[index], status: hike.status, status_label: hike.status_label }
    }
    return hike
  }

  async function cancelGroupHike(id: number, reason: string): Promise<GroupHike> {
    const hike = await groupHikeService.cancel(id, reason)
    const index = groupHikes.value.findIndex((h) => h.id === id)
    if (index !== -1) {
      groupHikes.value[index] = { ...groupHikes.value[index], status: hike.status, status_label: hike.status_label }
    }
    return hike
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    groupHikes.value = []
    loading.value = false
    error.value = null
    meta.value = { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    _initialized.value = false
    _lastFetchedAt.value = 0
    _hikesPromise = null
  }

  return {
    groupHikes,
    loading,
    error,
    meta,
    fetchGroupHikes,
    ensureGroupHikes,
    fetchGroupHike,
    createGroupHike,
    updateGroupHike,
    deleteGroupHike,
    publishGroupHike,
    unpublishGroupHike,
    cancelGroupHike,
    clearError,
    $reset,
  }
})
