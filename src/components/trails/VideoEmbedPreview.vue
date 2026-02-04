<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url: string
}>()

const embedUrl = computed(() => {
  if (!props.url) return null

  // YouTube
  const ytMatch = props.url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = props.url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return null
})
</script>

<template>
  <div class="video-embed">
    <div v-if="embedUrl" class="embed-container">
      <iframe
        :src="embedUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>
    <div v-else-if="url" class="embed-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>Unable to parse video URL. Please enter a valid YouTube or Vimeo URL.</span>
    </div>
  </div>
</template>

<style scoped>
.embed-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #000;
}

.embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.embed-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
