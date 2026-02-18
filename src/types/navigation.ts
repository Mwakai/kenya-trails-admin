export type IconName =
  | 'dashboard'
  | 'users'
  | 'building'
  | 'image'
  | 'map'
  | 'tag'
  | 'calendar'
  | 'activity-log'
  | 'chevron-down'
  | 'logout'
  | 'menu'
  | 'close'

export interface NavigationItem {
  name: string
  path: string
  icon: IconName
  permissions: string[]
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    permissions: [],
  },
  {
    name: 'Users',
    path: '/users',
    icon: 'users',
    permissions: ['users.view'],
  },
  {
    name: 'Companies',
    path: '/companies',
    icon: 'building',
    permissions: ['companies.view'],
  },
  {
    name: 'Media Library',
    path: '/media',
    icon: 'image',
    permissions: ['media.view'],
  },
  {
    name: 'Trails',
    path: '/trails',
    icon: 'map',
    permissions: ['trails.view'],
  },
  {
    name: 'Amenities',
    path: '/amenities',
    icon: 'tag',
    permissions: ['amenities.view'],
  },
  {
    name: 'Group Hikes',
    path: '/group-hikes',
    icon: 'calendar',
    permissions: ['group_hikes.view_all', 'group_hikes.view_own'],
  },
  {
    name: 'Activity Log',
    path: '/activity-logs',
    icon: 'activity-log',
    permissions: ['activity_logs.view'],
  },
]
