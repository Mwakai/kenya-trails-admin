import { useTrailsStore } from '@/stores/trails'
import { useAmenitiesStore } from '@/stores/amenities'
import { useUsersStore } from '@/stores/users'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'

export function usePrefetch() {
  const authStore = useAuthStore()
  const trailsStore = useTrailsStore()
  const amenitiesStore = useAmenitiesStore()
  const usersStore = useUsersStore()
  const mediaStore = useMediaStore()

  async function prefetchAll(): Promise<void> {
    const promises: Promise<void>[] = []

    if (authStore.hasAnyPermission(['trails.view', 'trails.create', 'trails.update'])) {
      promises.push(trailsStore.ensureTrails())
      promises.push(trailsStore.ensureRegions())
    }

    if (authStore.hasAnyPermission(['amenities.view', 'amenities.create', 'amenities.update'])) {
      promises.push(amenitiesStore.ensureAmenities())
    }

    if (authStore.hasAnyPermission(['users.view', 'users.create', 'users.update'])) {
      promises.push(usersStore.ensureUsers())
      promises.push(usersStore.ensureRoles())
      promises.push(usersStore.ensureCompanies())
    }

    if (authStore.hasAnyPermission(['media.view', 'media.create', 'media.update'])) {
      promises.push(mediaStore.ensureMedia())
    }

    await Promise.allSettled(promises)
  }

  function resetAll(): void {
    trailsStore.$reset()
    amenitiesStore.$reset()
    usersStore.$reset()
    mediaStore.$reset()
  }

  return { prefetchAll, resetAll }
}
