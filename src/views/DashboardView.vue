<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Kenya Trails Admin</h1>
        <button @click="handleLogout" class="logout-button">Logout</button>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="welcome-section">
        <h2>Welcome back, {{ authStore.user?.name || 'User' }}</h2>
        <p class="welcome-subtitle">Manage your Kenya Trails platform</p>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Tours</h3>
          <p>Manage your tours and packages</p>
        </div>

        <div class="dashboard-card">
          <h3>Bookings</h3>
          <p>View and manage bookings</p>
        </div>

        <div class="dashboard-card">
          <h3>Customers</h3>
          <p>Manage customer information</p>
        </div>

        <div class="dashboard-card">
          <h3>Settings</h3>
          <p>Configure your account</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--color-background);
}

.dashboard-header {
  background: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
  padding: 16px 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.logout-button {
  padding: 8px 16px;
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
}

.welcome-section {
  margin-bottom: 40px;
}

.welcome-section h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.dashboard-card {
  padding: 24px;
  background: var(--color-background-alt);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.dashboard-card p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
