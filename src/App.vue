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

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-background-alt);
}
</style>
