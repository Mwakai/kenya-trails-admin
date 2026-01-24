export type Role = 'super_admin' | 'admin' | 'content_manager' | 'group_hike_organizer'

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.manage_roles'
  | 'users.*'
  | 'companies.view'
  | 'companies.create'
  | 'companies.update'
  | 'companies.delete'
  | 'companies.*'
  | 'media.view'
  | 'media.create'
  | 'media.update'
  | 'media.delete'
  | 'media.*'
  | 'trails.view'
  | 'trails.create'
  | 'trails.update'
  | 'trails.delete'
  | 'trails.publish'
  | 'trails.*'
  | 'amenities.view'
  | 'amenities.create'
  | 'amenities.update'
  | 'amenities.delete'
  | 'amenities.*'
  | 'group_hikes.view_all'
  | 'group_hikes.view_own'
  | 'group_hikes.create'
  | 'group_hikes.update_all'
  | 'group_hikes.update_own'
  | 'group_hikes.delete_all'
  | 'group_hikes.delete_own'
  | 'group_hikes.publish'
  | 'group_hikes.*'

export interface UserRole {
  id: number
  name: string
  slug: string
  description: string
  permissions: string[]
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface UserCompany {
  id: number
  name: string
  slug: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar: string | null
  status: 'active' | 'inactive'
  email_verified_at: string | null
  last_login_at: string | null
  role: UserRole
  company: UserCompany | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  data: {
    token: string
    user: User
  }
  message: string
  status: number
}

export interface AuthState {
  user: User | null
  token: string | null
  permissions: string[]
}

// Pagination Types
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface UserFilters {
  page?: number
  per_page?: number
  search?: string
  role_id?: number
  status?: 'active' | 'inactive'
  company_id?: number
}

// User Management Types
export interface UserListResponse {
  data: {
    users: User[]
  }
  meta: PaginationMeta
  message: string
  status: number
}

export interface UserResponse {
  data: {
    user: User
  }
  message: string
  status: number
}

export interface UserDeleteResponse {
  data: []
  message: string
  status: number
}

export interface CreateUserPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  role_id: number
  company_id?: number
  phone?: string
  status?: 'active' | 'inactive'
}

export interface UpdateUserPayload {
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  password_confirmation?: string
  role_id?: number
  company_id?: number | null
  phone?: string
  status?: 'active' | 'inactive'
}

export interface RoleOption {
  id: number
  name: string
  slug: string
}

export interface RolesResponse {
  data: {
    roles: RoleOption[]
  }
  message: string
  status: number
}

export interface CompanyOption {
  id: number
  name: string
}

export interface CompaniesResponse {
  data: {
    companies: CompanyOption[]
  }
  message: string
  status: number
}

// Amenity Types
export interface Amenity {
  id: number
  name: string
  slug: string
  icon: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AmenityListResponse {
  data: {
    amenities: Amenity[]
  }
  message: string
  status: number
}

export interface AmenityResponse {
  data: {
    amenity: Amenity
  }
  message: string
  status: number
}

export interface AmenityDeleteResponse {
  data: []
  message: string
  status: number
}

export interface CreateAmenityPayload {
  name: string
  slug?: string
  icon?: string
  description?: string
  is_active?: boolean
}

export interface UpdateAmenityPayload {
  name?: string
  slug?: string
  icon?: string
  description?: string
  is_active?: boolean
}
