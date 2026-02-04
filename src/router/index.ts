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
          path: 'companies',
          name: 'companies',
          component: () => import('@/views/CompaniesView.vue'),
          meta: { title: 'Companies', permissions: ['companies.view'] },
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
          name: 'group-hikes',
          component: () => import('@/views/GroupHikesView.vue'),
          meta: {
            title: 'Group Hikes',
            permissions: ['group_hikes.view_all', 'group_hikes.view_own'],
          },
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
