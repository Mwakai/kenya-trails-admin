import { ref, computed } from 'vue'
import type { GroupHikeFilters, GroupHikeStatus } from '@/types/groupHike'

export function useGroupHikeFilters() {
  const filters = ref<GroupHikeFilters>({
    status: '',
    organizer_id: null,
    company_id: null,
    region_id: null,
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    per_page: 15,
    sort: 'start_date',
    order: 'asc',
  })

  const searchInput = ref('')
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  const hasActiveFilters = computed(() => {
    return !!(
      filters.value.search ||
      filters.value.status ||
      filters.value.organizer_id ||
      filters.value.company_id ||
      filters.value.region_id ||
      filters.value.date_from ||
      filters.value.date_to
    )
  })

  function handleSearchInput(onLoad: () => void) {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      filters.value.search = searchInput.value
      filters.value.page = 1
      onLoad()
    }, 300)
  }

  function handleFilterChange(onLoad: () => void) {
    filters.value.page = 1
    onLoad()
  }

  function setStatusFilter(status: GroupHikeStatus | '') {
    filters.value.status = status
    filters.value.page = 1
  }

  function clearFilters(onLoad: () => void) {
    searchInput.value = ''
    filters.value = {
      status: '',
      organizer_id: null,
      company_id: null,
      region_id: null,
      date_from: '',
      date_to: '',
      search: '',
      page: 1,
      per_page: filters.value.per_page,
      sort: 'start_date',
      order: 'asc',
    }
    onLoad()
  }

  function goToPage(page: number, lastPage: number, onLoad: () => void) {
    if (page < 1 || page > lastPage) return
    filters.value.page = page
    onLoad()
  }

  function handlePerPageChange(onLoad: () => void) {
    filters.value.page = 1
    onLoad()
  }

  return {
    filters,
    searchInput,
    hasActiveFilters,
    handleSearchInput,
    handleFilterChange,
    setStatusFilter,
    clearFilters,
    goToPage,
    handlePerPageChange,
  }
}
