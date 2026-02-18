import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/services/api'
import type { PaginationMeta } from '@/types/auth'
import type {
  ActivityLog,
  ActivityLogListResponse,
  ActivityLogResponse,
  ActivityLogFilters,
} from '@/types/activityLog'

const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

export const useActivityLogsStore = defineStore('activityLogs', () => {
  const logs = ref<ActivityLog[]>([])
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
  const _lastFetchedAt = ref(0)

  // In-flight deduplication
  let _logsPromise: Promise<void> | null = null

  async function fetchLogs(filters: ActivityLogFilters = {}, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.per_page) params.append('per_page', String(filters.per_page))
      if (filters.causer_id) params.append('causer_id', String(filters.causer_id))
      if (filters.log_name) params.append('log_name', filters.log_name)
      if (filters.event) params.append('event', filters.event)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)

      const queryString = params.toString()
      const endpoint = queryString ? `/admin/activity-logs?${queryString}` : '/admin/activity-logs'

      const response = await api.get<ActivityLogListResponse>(endpoint, {
        requiresAuth: true,
      })
      logs.value = response.data.activity_logs
      if (response.meta) {
        meta.value = response.meta
      }
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load activity logs'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureLogs(filters: ActivityLogFilters = {}): Promise<void> {
    if (_initialized.value && logs.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchLogs(filters, { silent: true }).catch(() => {})
      }
      return
    }
    if (_logsPromise) return _logsPromise
    _logsPromise = fetchLogs(filters).finally(() => { _logsPromise = null })
    return _logsPromise
  }

  async function fetchLog(id: number): Promise<ActivityLog> {
    const response = await api.get<ActivityLogResponse>(`/admin/activity-logs/${id}`, {
      requiresAuth: true,
    })
    return response.data.activity_log
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    logs.value = []
    loading.value = false
    error.value = null
    meta.value = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
    _initialized.value = false
    _lastFetchedAt.value = 0
    _logsPromise = null
  }

  return {
    logs,
    loading,
    error,
    meta,
    fetchLogs,
    ensureLogs,
    fetchLog,
    clearError,
    $reset,
  }
})
