<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppIcon from './AppIcon.vue'

defineProps<{
  sidebarCollapsed: boolean
}>()

const authStore = useAuthStore()
const showUserMenu = ref(false)

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}
</script>

<template>
  <header class="header" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <div class="header-left">
      <h1 class="page-title">
        <slot name="title">Dashboard</slot>
      </h1>
    </div>

    <div class="header-right">
      <div class="user-menu" v-click-outside="closeUserMenu">
        <button class="user-menu-trigger" @click="toggleUserMenu">
          <div class="user-avatar">
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.userName" />
            <span v-else class="user-initials">{{ authStore.userInitials }}</span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-role">{{ authStore.userRole }}</span>
          </div>
          <AppIcon name="chevron-down" :size="16" class="menu-arrow" :class="{ open: showUserMenu }" />
        </button>

        <Transition name="dropdown">
          <div v-if="showUserMenu" class="user-dropdown">
            <div class="dropdown-header">
              <span class="dropdown-email">{{ authStore.user?.email }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout" @click="authStore.logout">
              <AppIcon name="logout" :size="16" />
              <span>Logout</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  right: 0;
  left: var(--sidebar-width);
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: var(--z-header);
  transition: left var(--transition-normal);
}

.header.sidebar-collapsed {
  left: var(--sidebar-collapsed-width);
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.user-menu-trigger:hover {
  background: var(--color-background-alt);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-initials {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-tight);
}

.menu-arrow {
  color: var(--color-text-secondary);
  transition: transform var(--transition-fast);
}

.menu-arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.dropdown-header {
  padding: var(--space-3) var(--space-4);
}

.dropdown-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  text-align: left;
}

.dropdown-item:hover {
  background: var(--color-background-alt);
}

.dropdown-item.logout:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
