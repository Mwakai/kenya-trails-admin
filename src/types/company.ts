import type { Media } from '@/types/auth'
import type { PaginationMeta } from '@/types/auth'

export interface Company {
  id: number
  name: string
  slug: string
  description: string | null
  logo: Media | null
  cover_image: Media | null
  website: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  is_verified: boolean
  is_active: boolean
  hike_count: number
  created_at: string
}

export interface CompanyListItem {
  id: number
  name: string
  slug: string
  logo_thumbnail: string | null
  is_verified: boolean
  hike_count: number
}

export interface CompanyFormData {
  name: string
  slug: string
  description: string
  logo_id: number | null
  cover_image_id: number | null
  website: string
  email: string
  phone: string
  whatsapp: string
  instagram: string
  facebook: string
  is_verified: boolean
  is_active: boolean
}

// API Response types
export interface CompanyListResponse {
  data: {
    companies: CompanyListItem[]
  }
  meta: PaginationMeta
  message: string
  status: number
}

export interface CompanyResponse {
  data: {
    company: Company
  }
  message: string
  status: number
}

export interface CompanyDeleteResponse {
  data: []
  message: string
  status: number
}
