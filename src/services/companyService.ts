import { api } from '@/services/api'
import type {
  Company,
  CompanyListItem,
  CompanyFormData,
  CompanyListResponse,
  CompanyResponse,
  CompanyDeleteResponse,
} from '@/types/company'
import type { PaginationMeta } from '@/types/auth'

export const companyService = {
  async list(params?: { page?: number; per_page?: number; search?: string }): Promise<{ items: CompanyListItem[]; meta: PaginationMeta }> {
    const urlParams = new URLSearchParams()
    if (params?.page) urlParams.append('page', String(params.page))
    if (params?.per_page) urlParams.append('per_page', String(params.per_page))
    if (params?.search) urlParams.append('search', params.search)

    const queryString = urlParams.toString()
    const endpoint = queryString ? `/admin/companies?${queryString}` : '/admin/companies'
    const response = await api.get<CompanyListResponse>(endpoint, { requiresAuth: true })
    return { items: response.data.companies, meta: response.meta }
  },

  async get(id: number): Promise<Company> {
    const response = await api.get<CompanyResponse>(`/admin/companies/${id}`, { requiresAuth: true })
    return response.data.company
  },

  async create(data: CompanyFormData): Promise<Company> {
    const response = await api.post<CompanyResponse>('/admin/companies', data, { requiresAuth: true })
    return response.data.company
  },

  async update(id: number, data: Partial<CompanyFormData>): Promise<Company> {
    const response = await api.put<CompanyResponse>(`/admin/companies/${id}`, data, { requiresAuth: true })
    return response.data.company
  },

  async delete(id: number): Promise<void> {
    await api.delete<CompanyDeleteResponse>(`/admin/companies/${id}`, { requiresAuth: true })
  },

  async getForDropdown(): Promise<CompanyListItem[]> {
    const response = await api.get<CompanyListResponse>('/admin/companies?per_page=100', { requiresAuth: true })
    return response.data.companies
  },
}
