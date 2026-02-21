import { ref } from 'vue'
import { useGroupHikesStore } from '@/stores/groupHikes'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/services/api'

export function useGroupHikeActions() {
  const store = useGroupHikesStore()
  const toast = useToast()

  const actionLoading = ref(false)

  // Publish
  async function publish(id: number, onSuccess?: () => void) {
    actionLoading.value = true
    try {
      await store.publishGroupHike(id)
      toast.success('Group hike published successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to publish group hike')
    } finally {
      actionLoading.value = false
    }
  }

  // Unpublish
  async function unpublish(id: number, onSuccess?: () => void) {
    actionLoading.value = true
    try {
      await store.unpublishGroupHike(id)
      toast.success('Group hike unpublished')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to unpublish group hike')
    } finally {
      actionLoading.value = false
    }
  }

  // Cancel (requires reason)
  async function cancel(id: number, reason: string, onSuccess?: () => void) {
    if (!reason.trim()) {
      toast.error('Cancellation reason is required')
      return
    }
    actionLoading.value = true
    try {
      await store.cancelGroupHike(id, reason)
      toast.success('Group hike cancelled')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel group hike')
    } finally {
      actionLoading.value = false
    }
  }

  // Delete
  async function remove(id: number, onSuccess?: () => void) {
    actionLoading.value = true
    try {
      await store.deleteGroupHike(id)
      toast.success('Group hike deleted')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete group hike')
    } finally {
      actionLoading.value = false
    }
  }

  return {
    actionLoading,
    publish,
    unpublish,
    cancel,
    remove,
  }
}
