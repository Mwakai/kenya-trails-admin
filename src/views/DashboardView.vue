<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { navigationItems } from '@/types/navigation'
import AppIcon from '@/components/AppIcon.vue'

const authStore = useAuthStore()

const STORAGE_KEY = 'dashboard_shortcuts'

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
})

const availableShortcuts = computed(() =>
  navigationItems.filter(
    (item) =>
      item.path !== '/dashboard' && authStore.hasAnyPermission(item.permissions),
  ),
)

function loadSavedShortcuts(): string[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const hiddenPaths = ref<Set<string>>(new Set())

// Initialize: if saved preferences exist, compute hidden paths from them
const saved = loadSavedShortcuts()
if (saved) {
  const savedSet = new Set(saved)
  availableShortcuts.value.forEach((item) => {
    if (!savedSet.has(item.path)) {
      hiddenPaths.value.add(item.path)
    }
  })
}

const visibleShortcuts = computed(() =>
  availableShortcuts.value.filter((item) => !hiddenPaths.value.has(item.path)),
)

const isCustomizing = ref(false)

function isShortcutVisible(path: string): boolean {
  return !hiddenPaths.value.has(path)
}

function toggleShortcut(path: string) {
  const newSet = new Set(hiddenPaths.value)
  if (newSet.has(path)) {
    newSet.delete(path)
  } else {
    // Don't allow hiding all shortcuts
    if (visibleShortcuts.value.length <= 1) return
    newSet.add(path)
  }
  hiddenPaths.value = newSet

  // Persist visible paths
  const visible = availableShortcuts.value
    .filter((item) => !newSet.has(item.path))
    .map((item) => item.path)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visible))
}
</script>

<template>
  <div class="dashboard-page">
    <div class="welcome-section">
      <h2>{{ greeting }}, {{ authStore.userName }}</h2>
      <p class="welcome-subtitle">Manage your Kenya Trails platform</p>
    </div>

    <div class="shortcuts-section">
      <div class="shortcuts-header">
        <h3>Shortcuts</h3>
        <button class="customize-btn" @click="isCustomizing = !isCustomizing">
          {{ isCustomizing ? 'Done' : 'Customize' }}
        </button>
      </div>

      <div v-if="isCustomizing" class="customize-panel">
        <p class="customize-hint">Toggle shortcuts to show or hide them on your dashboard.</p>
        <div class="customize-list">
          <label
            v-for="item in availableShortcuts"
            :key="item.path"
            class="customize-item"
          >
            <input
              type="checkbox"
              :checked="isShortcutVisible(item.path)"
              @change="toggleShortcut(item.path)"
            />
            <AppIcon :name="item.icon" :size="18" />
            <span>{{ item.name }}</span>
          </label>
        </div>
      </div>

      <div class="shortcuts-grid">
        <router-link
          v-for="item in visibleShortcuts"
          :key="item.path"
          :to="item.path"
          class="shortcut-card"
        >
          <div class="shortcut-icon">
            <AppIcon :name="item.icon" :size="24" />
          </div>
          <span class="shortcut-label">{{ item.name }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1200px;
}

.welcome-section {
  margin-bottom: var(--space-8);
}

.welcome-section h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.welcome-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.shortcuts-section {
  margin-top: var(--space-2);
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.shortcuts-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.customize-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.customize-btn:hover {
  background: var(--color-primary);
  color: white;
}

.customize-panel {
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.customize-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3) 0;
}

.customize-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.customize-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

.customize-item input[type='checkbox'] {
  accent-color: var(--color-primary);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 200px));
  gap: var(--space-4);
}

.shortcut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.shortcut-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.shortcut-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.shortcut-card:hover .shortcut-icon {
  background: var(--color-primary);
  color: white;
}

.shortcut-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.shortcut-card:hover .shortcut-label {
  color: var(--color-primary);
}
</style>
