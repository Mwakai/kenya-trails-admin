<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useGoogleMaps } from '@/composables/useGoogleMaps'
import MediaPickerMultiple from '@/components/media/MediaPickerMultiple.vue'

const props = defineProps<{
  label: string
  name: string
  directions: string
  latitude: number | null
  longitude: number | null
  imageIds: number[]
}>()

const emit = defineEmits<{
  'update:name': [val: string]
  'update:directions': [val: string]
  'update:latitude': [val: number | null]
  'update:longitude': [val: number | null]
  'update:imageIds': [val: number[]]
}>()

const { initMap, createMarker } = useGoogleMaps()

const mapContainer = ref<HTMLElement | null>(null)
let map: google.maps.Map | null = null
let marker: google.maps.Marker | null = null

onMounted(async () => {
  if (!mapContainer.value) return

  try {
    const center = props.latitude && props.longitude
      ? { lat: props.latitude, lng: props.longitude }
      : { lat: 0.0236, lng: 37.9062 }

    map = await initMap(mapContainer.value, {
      zoom: props.latitude ? 14 : 7,
      center,
      mapTypeControl: false,
      streetViewControl: true,
    })

    if (props.latitude && props.longitude) {
      marker = createMarker(map, { lat: props.latitude, lng: props.longitude })
      marker.addListener('dragend', handleMarkerDrag)
    }

    map.addListener('click', handleMapClick)
  } catch {
    // Google Maps may not be available
  }
})

onBeforeUnmount(() => {
  if (marker) {
    google.maps.event.clearInstanceListeners(marker)
    marker.setMap(null)
  }
  if (map) {
    google.maps.event.clearInstanceListeners(map)
  }
})

function handleMapClick(e: google.maps.MapMouseEvent) {
  if (!e.latLng || !map) return

  const lat = e.latLng.lat()
  const lng = e.latLng.lng()

  if (marker) {
    marker.setPosition(e.latLng)
  } else {
    marker = createMarker(map, { lat, lng })
    marker.addListener('dragend', handleMarkerDrag)
  }

  emit('update:latitude', lat)
  emit('update:longitude', lng)
}

function handleMarkerDrag() {
  if (!marker) return
  const pos = marker.getPosition()
  if (pos) {
    emit('update:latitude', pos.lat())
    emit('update:longitude', pos.lng())
  }
}

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (map && lat && lng) {
      const pos = { lat: lat as number, lng: lng as number }
      if (marker) {
        marker.setPosition(pos)
      } else {
        marker = createMarker(map, pos)
        marker.addListener('dragend', handleMarkerDrag)
      }
    }
  },
)
</script>

<template>
  <div class="route-form">
    <h4 class="route-label">{{ label }}</h4>

    <div class="form-group">
      <label class="field-label">Route Name</label>
      <input
        type="text"
        class="form-input"
        placeholder="e.g. Main Trail"
        :value="name"
        @input="emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="field-label">Directions / Description</label>
      <textarea
        class="form-textarea"
        rows="4"
        placeholder="Describe the route directions..."
        :value="directions"
        @input="emit('update:directions', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="field-label">Route Start Point</label>
      <div ref="mapContainer" class="route-map" />
      <div v-if="latitude && longitude" class="coords-display">
        {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </div>
    </div>

    <MediaPickerMultiple
      :model-value="imageIds"
      label="Route Images"
      @update:model-value="emit('update:imageIds', $event)"
    />
  </div>
</template>

<style scoped>
.route-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background-alt);
}

.route-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input,
.form-textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.form-textarea {
  resize: vertical;
}

.route-map {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background-alt);
}

.coords-display {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: monospace;
  margin-top: var(--space-1);
}
</style>
