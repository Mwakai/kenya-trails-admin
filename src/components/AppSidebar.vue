<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navigationItems } from '@/types/navigation'
import AppIcon from './AppIcon.vue'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()

const route = useRoute()
const authStore = useAuthStore()

const filteredNavItems = computed(() => {
  return navigationItems.filter((item) => authStore.hasAnyPermission(item.permissions))
})

const isActiveRoute = (path: string): boolean => {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!collapsed">
        <span class="logo-text">Kenya Trails</span>
      </div>
      <button class="collapse-btn" @click="emit('toggleCollapse')" :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <AppIcon :name="collapsed ? 'menu' : 'close'" :size="20" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li v-for="item in filteredNavItems" :key="item.path" class="nav-item">
          <router-link :to="item.path" class="nav-link" :class="{ active: isActiveRoute(item.path) }">
            <AppIcon :name="item.icon" :size="20" />
            <span v-show="!collapsed" class="nav-text">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="authStore.logout" :title="collapsed ? 'Logout' : ''">
        <AppIcon name="logout" :size="20" />
        <span v-show="!collapsed" class="logout-text">Logout</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-width);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sidebar);
  transition: width var(--transition-normal);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  white-space: nowrap;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) 0;
}

.nav-list {
  list-style: none;
  padding: 0 var(--space-3);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: var(--space-3);
}

.nav-link:hover {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.nav-link.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-link.active:hover {
  background: var(--color-primary-alpha);
}

.nav-text {
  white-space: nowrap;
}

.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  padding: var(--space-3);
}

.logout-btn:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.logout-text {
  white-space: nowrap;
}
</style>
