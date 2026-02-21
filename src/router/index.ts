import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { title: 'Users', permissions: ['users.view'] },
        },
        {
          path: 'media',
          name: 'media',
          component: () => import('@/views/MediaView.vue'),
          meta: { title: 'Media Library', permissions: ['media.view'] },
        },
        {
          path: 'trails',
          meta: { permissions: ['trails.view'] },
          children: [
            {
              path: '',
              name: 'trails',
              component: () => import('@/views/trails/TrailListPage.vue'),
              meta: { title: 'Trails' },
            },
            {
              path: 'create',
              name: 'trails-create',
              component: () => import('@/views/trails/TrailFormPage.vue'),
              meta: { title: 'Create Trail', permissions: ['trails.create'] },
            },
            {
              path: ':id/edit',
              name: 'trails-edit',
              component: () => import('@/views/trails/TrailFormPage.vue'),
              meta: { title: 'Edit Trail', permissions: ['trails.update'] },
            },
          ],
        },
        {
          path: 'amenities',
          name: 'amenities',
          component: () => import('@/views/AmenitiesView.vue'),
          meta: { title: 'Amenities', permissions: ['amenities.view'] },
        },
        {
          path: 'group-hikes',
          meta: { permissions: ['group_hikes.view_all', 'group_hikes.view_own'] },
          children: [
            {
              path: '',
              name: 'group-hikes',
              component: () => import('@/views/group-hikes/GroupHikeListPage.vue'),
              meta: { title: 'Group Hikes' },
            },
            {
              path: 'create',
              name: 'group-hikes-create',
              component: () => import('@/views/group-hikes/GroupHikeFormPage.vue'),
              meta: { title: 'Create Group Hike', permissions: ['group_hikes.create'] },
            },
            {
              path: ':id/edit',
              name: 'group-hikes-edit',
              component: () => import('@/views/group-hikes/GroupHikeFormPage.vue'),
              meta: { title: 'Edit Group Hike', permissions: ['group_hikes.update_own', 'group_hikes.update_all'] },
            },
            {
              path: ':id',
              name: 'group-hike-detail',
              component: () => import('@/views/group-hikes/GroupHikeDetailPage.vue'),
              meta: { title: 'Group Hike Detail' },
            },
          ],
        },
        {
          path: 'companies',
          meta: { permissions: ['companies.view'] },
          children: [
            {
              path: '',
              name: 'companies',
              component: () => import('@/views/companies/CompanyListPage.vue'),
              meta: { title: 'Companies' },
            },
            {
              path: 'create',
              name: 'companies-create',
              component: () => import('@/views/companies/CompanyFormPage.vue'),
              meta: { title: 'Add Company', permissions: ['companies.create'] },
            },
            {
              path: ':id/edit',
              name: 'companies-edit',
              component: () => import('@/views/companies/CompanyFormPage.vue'),
              meta: { title: 'Edit Company', permissions: ['companies.update'] },
            },
          ],
        },
        {
          path: 'activity-logs',
          name: 'activity-logs',
          component: () => import('@/views/ActivityLogView.vue'),
          meta: { title: 'Activity Log', permissions: ['activity_logs.view'] },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  const requiredPermissions = to.meta.permissions as string[] | undefined
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!authStore.hasAnyPermission(requiredPermissions)) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
