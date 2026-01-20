export type Role = 'super_admin' | 'admin' | 'content_manager' | 'group_hike_organizer'

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
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
