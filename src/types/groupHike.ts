import type { Media } from '@/types/auth'

export type GroupHikeStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export type Difficulty = 'easy' | 'moderate' | 'difficult' | 'expert'

export interface GroupHikeOrganizer {
  id: number
  name: string
  email: string
}

export interface GroupHikeCompany {
  id: number
  name: string
  slug: string
  logo_thumbnail?: string
}

export interface GroupHikeTrail {
  id: number
  slug: string
  name: string
  difficulty: Difficulty
  region: { id: number; name: string }
}

export interface GroupHikeLocation {
  type: 'trail' | 'custom'
  name: string
  latitude: number
  longitude: number
  region: { id: number; name: string }
}

export interface GroupHikeDates {
  start_date: string
  start_time: string
  end_date: string | null
  end_time: string | null
  is_multi_day: boolean
}

export interface GroupHikeCapacity {
  max_participants: number | null
  spots_remaining: number | null
}

export interface GroupHikeRegistration {
  url: string | null
  deadline: string | null
  notes: string | null
  is_open: boolean
}

export interface GroupHikePricing {
  price: number | null
  currency: string
  formatted: string
  notes: string | null
  is_free: boolean
}

export interface GroupHikeContact {
  name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
}

export interface GroupHikeGalleryImage {
  id: number
  media_id: number
  urls: { thumbnail: string; medium: string; large: string }
  caption: string | null
  sort_order: number
}

export interface GroupHike {
  id: number
  title: string
  slug: string
  description: string
  short_description: string | null
  organizer: GroupHikeOrganizer | null
  company: GroupHikeCompany | null
  trail: GroupHikeTrail | null
  location?: GroupHikeLocation
  meeting_point: string | null
  dates?: GroupHikeDates
  date_display: string
  time_display: string
  capacity?: GroupHikeCapacity
  registration?: GroupHikeRegistration
  pricing?: GroupHikePricing
  contact?: GroupHikeContact
  difficulty: Difficulty
  difficulty_label: string
  featured_image: Media | null
  gallery: GroupHikeGalleryImage[]
  status: GroupHikeStatus
  status_label: string
  published_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  is_featured: boolean
  is_recurring: boolean
  recurring_notes: string | null
  is_past: boolean
  created_by: { id: number; name: string }
  created_at: string
  updated_at: string
  can_edit: boolean
  can_delete: boolean
  can_publish: boolean
  can_cancel: boolean
}

export interface GroupHikeListItem {
  id: number
  title: string
  slug: string
  short_description: string | null
  organizer: { id: number; name: string } | null
  company: { id: number; name: string; slug: string } | null
  location_name: string | null
  region: { id: number; name: string } | null
  start_date: string | null
  start_time: string | null
  end_date: string | null
  date_display: string
  is_multi_day: boolean
  max_participants: number | null
  price_formatted: string | null
  is_free: boolean
  difficulty: Difficulty | null
  featured_image: { thumbnail: string; medium: string } | null
  status: GroupHikeStatus
  status_label: string
  is_featured: boolean
  is_past: boolean
  created_at: string
  can_edit: boolean
  can_delete: boolean
}

export interface GroupHikeFormData {
  title: string
  slug: string
  description: string
  short_description: string
  organizer_id: number | null
  company_id: number | null
  location_type: 'trail' | 'custom'
  trail_id: number | null
  custom_location_name: string
  latitude: number | null
  longitude: number | null
  region_id: number | null
  meeting_point: string
  start_date: string
  start_time: string
  is_multi_day: boolean
  end_date: string
  end_time: string
  max_participants: number | null
  registration_url: string
  registration_deadline: string
  registration_notes: string
  is_free: boolean
  price: number | null
  price_currency: string
  price_notes: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_whatsapp: string
  difficulty: Difficulty | null
  featured_image_id: number | null
  is_featured: boolean
  is_recurring: boolean
  recurring_notes: string
  gallery: Array<{ media_id: number; caption: string; sort_order: number }>
}

export interface GroupHikeFilters {
  status: GroupHikeStatus | ''
  organizer_id: number | null
  company_id: number | null
  region_id: number | null
  date_from: string
  date_to: string
  search: string
  page: number
  per_page: number
  sort: string
  order: 'asc' | 'desc'
}

// API Response types
export interface GroupHikeListResponse {
  data: {
    group_hikes: GroupHikeListItem[]
  }
  meta: import('@/types/auth').PaginationMeta
  message: string
  status: number
}

export interface GroupHikeResponse {
  data: {
    group_hike: GroupHike
  }
  message: string
  status: number
}

export interface GroupHikeDeleteResponse {
  data: []
  message: string
  status: number
}
