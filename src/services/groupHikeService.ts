import { api } from '@/services/api'
import type {
  GroupHike,
  GroupHikeListItem,
  GroupHikeFormData,
  GroupHikeFilters,
  GroupHikeListResponse,
  GroupHikeResponse,
  GroupHikeDeleteResponse,
} from '@/types/groupHike'
import type { PaginationMeta } from '@/types/auth'

export const groupHikeService = {
  async list(filters: Partial<GroupHikeFilters> = {}): Promise<{ items: GroupHikeListItem[]; meta: PaginationMeta }> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.per_page) params.append('per_page', String(filters.per_page))
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.organizer_id) params.append('organizer_id', String(filters.organizer_id))
    if (filters.company_id) params.append('company_id', String(filters.company_id))
    if (filters.region_id) params.append('region_id', String(filters.region_id))
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const queryString = params.toString()
    const endpoint = queryString ? `/admin/group-hikes?${queryString}` : '/admin/group-hikes'
    const response = await api.get<GroupHikeListResponse>(endpoint, { requiresAuth: true })
    return { items: response.data.group_hikes, meta: response.meta }
  },

  async get(id: number): Promise<GroupHike> {
    const response = await api.get<GroupHikeResponse>(`/admin/group-hikes/${id}`, { requiresAuth: true })
    return response.data.group_hike
  },

  async create(data: GroupHikeFormData): Promise<GroupHike> {
    const response = await api.post<GroupHikeResponse>('/admin/group-hikes', data, { requiresAuth: true })
    return response.data.group_hike
  },

  async update(id: number, data: Partial<GroupHikeFormData>): Promise<GroupHike> {
    const response = await api.put<GroupHikeResponse>(`/admin/group-hikes/${id}`, data, { requiresAuth: true })
    return response.data.group_hike
  },

  async delete(id: number): Promise<void> {
    await api.delete<GroupHikeDeleteResponse>(`/admin/group-hikes/${id}`, { requiresAuth: true })
  },

  async publish(id: number): Promise<GroupHike> {
    const response = await api.patch<GroupHikeResponse>(`/admin/group-hikes/${id}/publish`, {}, { requiresAuth: true })
    return response.data.group_hike
  },

  async unpublish(id: number): Promise<GroupHike> {
    const response = await api.patch<GroupHikeResponse>(`/admin/group-hikes/${id}/unpublish`, {}, { requiresAuth: true })
    return response.data.group_hike
  },

  async cancel(id: number, reason: string): Promise<GroupHike> {
    const response = await api.patch<GroupHikeResponse>(
      `/admin/group-hikes/${id}/cancel`,
      { cancellation_reason: reason },
      { requiresAuth: true },
    )
    return response.data.group_hike
  },
}
