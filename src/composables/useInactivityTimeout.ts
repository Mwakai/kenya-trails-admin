import { watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const

export function useInactivityTimeout() {
  const authStore = useAuthStore()
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function resetTimer() {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (authStore.isAuthenticated) {
      timeoutId = setTimeout(() => {
        authStore.logout()
      }, INACTIVITY_TIMEOUT_MS)
    }
  }

  function setupListeners() {
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true })
    })
    resetTimer()
  }

  function removeListeners() {
    ACTIVITY_EVENTS.forEach((event) => {
      document.removeEventListener(event, resetTimer)
    })
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Watch authentication state
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        setupListeners()
      } else {
        removeListeners()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    removeListeners()
  })
}
