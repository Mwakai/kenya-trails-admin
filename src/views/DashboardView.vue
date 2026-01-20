<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="dashboard-page">
    <div class="welcome-section">
      <h2>Welcome back, {{ authStore.userName }}</h2>
      <p class="welcome-subtitle">Manage your Kenya Trails platform</p>
    </div>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon trails">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">--</span>
          <span class="stat-label">Total Trails</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon hikes">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">--</span>
          <span class="stat-label">Upcoming Hikes</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon users">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">--</span>
          <span class="stat-label">Total Users</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon media">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">--</span>
          <span class="stat-label">Media Files</span>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="actions-grid">
        <router-link to="/trails" class="action-card" v-if="authStore.hasPermission('trails.view')">
          <span class="action-title">Manage Trails</span>
          <span class="action-desc">View and edit trail information</span>
        </router-link>

        <router-link to="/group-hikes" class="action-card" v-if="authStore.hasAnyPermission(['group_hikes.view_all', 'group_hikes.view_own'])">
          <span class="action-title">Group Hikes</span>
          <span class="action-desc">Manage upcoming group hikes</span>
        </router-link>

        <router-link to="/media" class="action-card" v-if="authStore.hasPermission('media.view')">
          <span class="action-title">Media Library</span>
          <span class="action-desc">Upload and manage media</span>
        </router-link>

        <router-link to="/users" class="action-card" v-if="authStore.hasPermission('users.view')">
          <span class="action-title">Users</span>
          <span class="action-desc">Manage user accounts</span>
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-10);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
}

.stat-icon.trails {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.stat-icon.hikes {
  background: #e0f2fe;
  color: #0284c7;
}

.stat-icon.users {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-icon.media {
  background: #fef3c7;
  color: #d97706;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.quick-actions h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4) 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.action-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.action-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.action-card:hover .action-title {
  color: var(--color-primary);
}

.action-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
