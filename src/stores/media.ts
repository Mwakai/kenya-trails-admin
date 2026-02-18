import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError, sanitizeErrorMessage } from '@/services/api'
import type {
  Media,
  MediaType,
  MediaListResponse,
  MediaResponse,
  MediaDeleteResponse,
  PaginationMeta,
} from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL
const STALE_AFTER_MS = 5 * 60 * 1000 // 5 minutes

export const useMediaStore = defineStore('media', () => {
  const media = ref<Media[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta | null>(null)

  // Cache tracking
  const _initialized = ref(false)
  const _lastFetchedAt = ref(0)

  // In-flight deduplication
  let _promise: Promise<void> | null = null

  async function fetchMedia(page = 1, type?: MediaType, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      let endpoint = `/admin/media?page=${page}`
      if (type) endpoint += `&type=${type}`
      const response = await api.get<MediaListResponse>(endpoint, {
        requiresAuth: true,
      })
      if (page === 1) {
        media.value = response.data.media
      } else {
        media.value = [...media.value, ...response.data.media]
      }
      meta.value = response.meta
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load media'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function ensureMedia(): Promise<void> {
    if (_initialized.value && media.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchMedia(1, undefined, { silent: true }).catch(() => {})
      }
      return
    }
    if (_promise) return _promise
    _promise = fetchMedia(1).finally(() => { _promise = null })
    return _promise
  }

  async function uploadFile(
    file: File,
    altText?: string,
    onProgress?: (percent: number) => void,
  ): Promise<Media> {
    const formData = new FormData()
    formData.append('file', file)
    if (altText) formData.append('alt_text', altText)

    const token = sessionStorage.getItem('token')

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}/admin/media`)
      xhr.setRequestHeader('Accept', 'application/json')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response: MediaResponse = JSON.parse(xhr.responseText)
          media.value.unshift(response.data.media)
          if (meta.value) meta.value.total += 1
          resolve(response.data.media)
        } else {
          const errorData = (() => { try { return JSON.parse(xhr.responseText) } catch { return null } })()
          reject(new ApiError(sanitizeErrorMessage(errorData?.message, xhr.status), xhr.status, errorData))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new ApiError('Unable to connect to the server. Please check your connection and try again.', 0))
      })

      xhr.addEventListener('abort', () => {
        reject(new ApiError('Upload cancelled', 0))
      })

      xhr.send(formData)
    })
  }

  async function updateMedia(id: number, altText: string): Promise<Media> {
    const response = await api.patch<MediaResponse>(
      `/admin/media/${id}`,
      { alt_text: altText },
      { requiresAuth: true },
    )
    const index = media.value.findIndex((m) => m.id === id)
    if (index !== -1) {
      media.value[index] = response.data.media
    }
    return response.data.media
  }

  async function deleteMedia(id: number): Promise<void> {
    await api.delete<MediaDeleteResponse>(`/admin/media/${id}`, {
      requiresAuth: true,
    })
    media.value = media.value.filter((m) => m.id !== id)
    if (meta.value) meta.value.total -= 1
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    media.value = []
    loading.value = false
    error.value = null
    meta.value = null
    _initialized.value = false
    _lastFetchedAt.value = 0
    _promise = null
  }

  return {
    media,
    loading,
    error,
    meta,
    fetchMedia,
    ensureMedia,
    uploadFile,
    updateMedia,
    deleteMedia,
    clearError,
    $reset,
  }
})
