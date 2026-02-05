<script setup lang="ts">
import { useInactivityTimeout } from '@/composables/useInactivityTimeout'
import AppToast from '@/components/AppToast.vue'

useInactivityTimeout()
</script>

<template>
  <router-view />
  <AppToast />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 60% - Dominant/Background Colors (Neutrals) */
  --color-background: #ffffff;
  --color-background-alt: #f8f9fa;
  --color-surface: #ffffff;

  /* 30% - Secondary Colors (Text & Borders) */
  --color-text-primary: #2d3748;
  --color-text-secondary: #718096;
  --color-border: #e2e8f0;
  --color-border-hover: #cbd5e0;

  /* 10% - Primary/Accent Color */
  --color-primary: #e55a25;
  --color-primary-hover: #c74d1f;
  --color-primary-light: #fef5f1;
  --color-primary-alpha: rgba(229, 90, 37, 0.1);

  /* Semantic Colors */
  --color-success: #15803d;
  --color-success-bg: #f0fdf4;
  --color-success-border: #86efac;
  --color-error: #c53030;
  --color-error-bg: #fff5f5;
  --color-error-border: #fc8181;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-background-alt);
}
</style>
