import type { Media, PaginationMeta, Amenity } from './auth'

export type TrailStatus = 'draft' | 'published' | 'archived'
export type TrailDifficulty = 'easy' | 'moderate' | 'difficult' | 'expert'
export type DurationType = 'hours' | 'days'
export type AccommodationType = 'camping' | 'huts' | 'bandas' | 'hotels'

export interface TrailGalleryImage {
  id: number
  media_id: number
  caption: string | null
  sort_order: number
  media: Media
}

export interface TrailGpxFile {
  id: number
  media_id: number
  name: string
  media: Media
}

export interface TrailRoute {
  id: number
  label: string
  name: string | null
  directions: string | null
  latitude: number | null
  longitude: number | null
  images: Media[]
}

export interface Region {
  id: number
  name: string
  slug: string
  description: string | null
  latitude: number | null
  longitude: number | null
  trail_count: number
}

export interface ItineraryDay {
  id: number
  day_number: number
  title: string
  description: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  start_point: string | null
  end_point: string | null
  accommodation: string | null
}

export interface Trail {
  id: number
  name: string
  slug: string
  short_description: string | null
  description: string | null
  status: TrailStatus
  difficulty: TrailDifficulty | null
  distance_km: number | null
  duration_type: DurationType | null
  duration_min: number | null
  duration_max: number | null
  is_multi_day: boolean
  elevation_gain_m: number | null
  max_altitude_m: number | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  region_id: number | null
  region: Region | null
  is_year_round: boolean
  best_months: number[]
  season_notes: string | null
  requires_guide: boolean
  requires_permit: boolean
  permit_info: string | null
  accommodation_types: AccommodationType[]
  video_url: string | null
  featured_image_id: number | null
  featured_image: Media | null
  route_a: TrailRoute | null
  route_b: TrailRoute | null
  gallery: TrailGalleryImage[]
  gpx_files: TrailGpxFile[]
  amenities: Amenity[]
  itinerary: ItineraryDay[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// API Responses
export interface TrailListResponse {
  data: {
    trails: Trail[]
  }
  meta: PaginationMeta
  message: string
  status: number
}

export interface TrailResponse {
  data: {
    trail: Trail
  }
  message: string
  status: number
}

export interface TrailDeleteResponse {
  data: []
  message: string
  status: number
}

export interface RegionOption {
  id: number
  name: string
  slug: string
  trail_count?: number
}

export interface RegionListResponse {
  data: {
    regions: RegionOption[]
  }
  message: string
  status: number
}

// Filters
export interface TrailFilters {
  page?: number
  per_page?: number
  search?: string
  status?: TrailStatus
  difficulty?: TrailDifficulty
  region_id?: number
  with_deleted?: boolean
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

// Payloads
export interface CreateTrailPayload {
  name: string
  short_description?: string
  description?: string
  status?: TrailStatus
  difficulty?: TrailDifficulty
  distance_km?: number
  duration_type?: DurationType
  duration_min?: number
  duration_max?: number
  is_multi_day?: boolean
  elevation_gain_m?: number
  max_altitude_m?: number
  latitude?: number
  longitude?: number
  location_name?: string
  region_id?: number
  is_year_round?: boolean
  best_months?: number[]
  season_notes?: string
  requires_guide?: boolean
  requires_permit?: boolean
  permit_info?: string
  accommodation_types?: AccommodationType[]
  video_url?: string
  featured_image_id?: number
  amenity_ids?: number[]
  route_a?: RoutePayload
  route_b?: RoutePayload
  gallery?: GalleryItemPayload[]
  gpx_file_ids?: number[]
  itinerary?: ItineraryDayPayload[]
}

export interface UpdateTrailPayload extends Partial<CreateTrailPayload> {}

export interface RoutePayload {
  name?: string
  directions?: string
  latitude?: number
  longitude?: number
  image_ids?: number[]
}

export interface GalleryItemPayload {
  media_id: number
  caption?: string
  sort_order: number
}

export interface ItineraryDayPayload {
  day_number: number
  title: string
  description?: string
  distance_km?: number
  elevation_gain_m?: number
  start_point?: string
  end_point?: string
  accommodation?: string
}

export interface ItineraryDayForm {
  day_number: number
  title: string
  description: string
  distance_km: number | null
  elevation_gain_m: number | null
  start_point: string
  end_point: string
  accommodation: string
}

// Wizard form state
export interface TrailFormData {
  // Step 0: Basic Info
  name: string
  short_description: string
  description: string

  // Step 1: Stats & Requirements
  difficulty: TrailDifficulty | ''
  distance_km: number | null
  duration_type: DurationType
  duration_min: number | null
  duration_max: number | null
  is_multi_day: boolean
  elevation_gain_m: number | null
  max_altitude_m: number | null
  amenity_ids: number[]
  is_year_round: boolean
  best_months: number[]
  season_notes: string
  requires_guide: boolean
  requires_permit: boolean
  permit_info: string
  accommodation_types: AccommodationType[]

  // Step 2: Location & Region
  latitude: number | null
  longitude: number | null
  location_name: string
  region_id: number | null
  gpx_file_ids: number[]

  // Step 3: Routes
  route_a: {
    name: string
    directions: string
    latitude: number | null
    longitude: number | null
    image_ids: number[]
  }
  route_b_enabled: boolean
  route_b: {
    name: string
    directions: string
    latitude: number | null
    longitude: number | null
    image_ids: number[]
  }

  // Step 4: Media
  featured_image_id: number | null
  featured_image: Media | null
  gallery: {
    media_id: number
    media: Media
    caption: string
    sort_order: number
  }[]
  video_url: string

  // Step 5: Itinerary
  itinerary: ItineraryDayForm[]

  // Step 6: Review
  publish_status: TrailStatus
}
