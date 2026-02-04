import type { Media, PaginationMeta, Amenity } from './auth'

export type TrailStatus = 'draft' | 'published' | 'archived'
export type TrailDifficulty = 'easy' | 'moderate' | 'difficult' | 'expert'

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

export interface County {
  id: number
  name: string
  slug: string
  is_popular: boolean
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
  duration_hours: number | null
  elevation_gain_m: number | null
  max_altitude_m: number | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  county_id: number | null
  county: County | null
  video_url: string | null
  featured_image_id: number | null
  featured_image: Media | null
  route_a: TrailRoute | null
  route_b: TrailRoute | null
  gallery: TrailGalleryImage[]
  gpx_files: TrailGpxFile[]
  amenities: Amenity[]
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

export interface CountyOption {
  slug: string
  name: string
  is_popular: boolean
}

export interface CountyListResponse {
  data: {
    counties: {
      popular: Record<string, string>
      other: Record<string, string>
      all: Record<string, string>
    }
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
  county_slug?: string
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
  duration_hours?: number
  elevation_gain_m?: number
  max_altitude_m?: number
  latitude?: number
  longitude?: number
  location_name?: string
  county_id?: number
  county?: string
  video_url?: string
  featured_image_id?: number
  amenity_ids?: number[]
  route_a?: RoutePayload
  route_b?: RoutePayload
  gallery?: GalleryItemPayload[]
  gpx_file_ids?: number[]
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

// Wizard form state
export interface TrailFormData {
  // Step 1: Basic Info
  name: string
  short_description: string
  description: string

  // Step 2: Stats
  difficulty: TrailDifficulty | ''
  distance_km: number | null
  duration_hours: number | null
  elevation_gain_m: number | null
  max_altitude_m: number | null
  amenity_ids: number[]

  // Step 3: Location
  latitude: number | null
  longitude: number | null
  location_name: string
  county_id: number | null
  county_slug: string
  gpx_file_ids: number[]

  // Step 4: Routes
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

  // Step 5: Media
  featured_image_id: number | null
  featured_image: Media | null
  gallery: {
    media_id: number
    media: Media
    caption: string
    sort_order: number
  }[]
  video_url: string

  // Step 6: Review
  publish_status: TrailStatus
}
