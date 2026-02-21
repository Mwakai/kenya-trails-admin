import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/services/api'
import { companyService } from '@/services/companyService'
import type { Company, CompanyListItem, CompanyFormData } from '@/types/company'
import type { PaginationMeta } from '@/types/auth'

const STALE_AFTER_MS = 5 * 60 * 1000

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref<CompanyListItem[]>([])
  const dropdownCompanies = ref<CompanyListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  const _initialized = ref(false)
  const _dropdownInitialized = ref(false)
  const _lastFetchedAt = ref(0)
  let _companiesPromise: Promise<void> | null = null
  let _dropdownPromise: Promise<void> | null = null

  async function fetchCompanies(params?: { page?: number; per_page?: number; search?: string }, opts?: { silent?: boolean }): Promise<void> {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const result = await companyService.list(params)
      companies.value = result.items
      if (result.meta) {
        meta.value = result.meta
      }
      _initialized.value = true
      _lastFetchedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Failed to load companies'
      throw err
    } finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function fetchDropdownCompanies(): Promise<void> {
    try {
      const items = await companyService.getForDropdown()
      dropdownCompanies.value = items
      _dropdownInitialized.value = true
    } catch {
      // Silently fail - dropdown will just be empty
    }
  }

  async function ensureDropdownCompanies(): Promise<void> {
    if (_dropdownInitialized.value && dropdownCompanies.value.length > 0) return
    if (_dropdownPromise) return _dropdownPromise
    _dropdownPromise = fetchDropdownCompanies().finally(() => { _dropdownPromise = null })
    return _dropdownPromise
  }

  async function ensureCompanies(params?: { page?: number; per_page?: number }): Promise<void> {
    if (_initialized.value && companies.value.length > 0) {
      if (Date.now() - _lastFetchedAt.value > STALE_AFTER_MS) {
        fetchCompanies(params, { silent: true }).catch(() => {})
      }
      return
    }
    if (_companiesPromise) return _companiesPromise
    _companiesPromise = fetchCompanies(params).finally(() => { _companiesPromise = null })
    return _companiesPromise
  }

  async function fetchCompany(id: number): Promise<Company> {
    return companyService.get(id)
  }

  async function createCompany(data: CompanyFormData): Promise<Company> {
    return companyService.create(data)
  }

  async function updateCompany(id: number, data: Partial<CompanyFormData>): Promise<Company> {
    const company = await companyService.update(id, data)
    const index = companies.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      companies.value[index] = {
        ...companies.value[index],
        name: company.name,
        slug: company.slug,
        is_verified: company.is_verified,
      }
    }
    return company
  }

  async function deleteCompany(id: number): Promise<void> {
    await companyService.delete(id)
    companies.value = companies.value.filter((c) => c.id !== id)
    dropdownCompanies.value = dropdownCompanies.value.filter((c) => c.id !== id)
  }

  function clearError(): void {
    error.value = null
  }

  function $reset(): void {
    companies.value = []
    dropdownCompanies.value = []
    loading.value = false
    error.value = null
    meta.value = { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    _initialized.value = false
    _dropdownInitialized.value = false
    _lastFetchedAt.value = 0
    _companiesPromise = null
    _dropdownPromise = null
  }

  return {
    companies,
    dropdownCompanies,
    loading,
    error,
    meta,
    fetchCompanies,
    fetchDropdownCompanies,
    ensureDropdownCompanies,
    ensureCompanies,
    fetchCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    clearError,
    $reset,
  }
})
