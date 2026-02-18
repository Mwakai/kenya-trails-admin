import type { PaginationMeta } from '@/types/auth'

export interface ActivityLogCauser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
}

export interface ActivityLog {
  id: number
  log_name: string
  event: string
  subject_type: string | null
  subject_id: number | null
  causer_type: string | null
  causer_id: number | null
  causer: ActivityLogCauser | null
  properties: Record<string, unknown> | null
  created_at: string
}

export interface ActivityLogFilters {
  page?: number
  per_page?: number
  causer_id?: number
  log_name?: string
  event?: string
  date_from?: string
  date_to?: string
}

export interface ActivityLogListResponse {
  data: {
    activity_logs: ActivityLog[]
  }
  meta: PaginationMeta
  message: string
  status: number
}

export interface ActivityLogResponse {
  data: {
    activity_log: ActivityLog
  }
  message: string
  status: number
}
