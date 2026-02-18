<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import { usePrefetch } from '@/composables/usePrefetch'

const route = useRoute()
const sidebarCollapsed = ref(false)
const { prefetchAll } = usePrefetch()

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const getPageTitle = (): string => {
  return (route.meta.title as string) || 'Dashboard'
}

onMounted(() => {
  prefetchAll()
})
</script>

<template>
  <div class="dashboard-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />

    <AppHeader :sidebar-collapsed="sidebarCollapsed">
      <template #title>{{ getPageTitle() }}</template>
    </AppHeader>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: var(--color-background-alt);
}

.main-content {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: var(--space-6);
  min-height: calc(100vh - var(--header-height));
  transition: margin-left var(--transition-normal);
}

.dashboard-layout.sidebar-collapsed .main-content {
  margin-left: var(--sidebar-collapsed-width);
}
</style>
