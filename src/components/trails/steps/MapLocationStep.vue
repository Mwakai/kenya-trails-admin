<script setup lang="ts">
import { inject, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { trailFormKey } from '@/composables/useTrailForm'
import { useTrailsStore } from '@/stores/trails'
import { useGoogleMaps } from '@/composables/useGoogleMaps'
import GpxFileManager from '@/components/trails/GpxFileManager.vue'

const ctx = inject(trailFormKey)!
const trailsStore = useTrailsStore()
const { initMap, createMarker, createAutocomplete, loadError, resolveLatLng } = useGoogleMaps()

const errors = computed(() => ctx.stepErrors.value[2] || {})

const mapContainer = ref<HTMLElement | null>(null)
const searchContainer = ref<HTMLElement | null>(null)
let map: google.maps.Map | null = null
let marker: google.maps.marker.AdvancedMarkerElement | null = null

onMounted(async () => {
  if (trailsStore.regions.length === 0) {
    trailsStore.fetchRegions()
  }

  if (!mapContainer.value) return

  try {
    const center = ctx.formData.latitude && ctx.formData.longitude
      ? { lat: ctx.formData.latitude, lng: ctx.formData.longitude }
      : { lat: 0.0236, lng: 37.9062 }

    map = await initMap(mapContainer.value, {
      zoom: ctx.formData.latitude ? 14 : 7,
      center,
    })

    if (ctx.formData.latitude && ctx.formData.longitude) {
      marker = createMarker(map, { lat: ctx.formData.latitude, lng: ctx.formData.longitude })
      marker.addEventListener('gmp-dragend', handleMarkerDrag)
    }

    map.addListener('click', handleMapClick)

    // Setup autocomplete
    if (searchContainer.value) {
      const autocomplete = await createAutocomplete(searchContainer.value)
      autocomplete.addEventListener('gmp-placeselect', async (event) => {
        const place = (event as unknown as { place: google.maps.places.Place }).place
        await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] })

        if (place.location) {
          const lat = place.location.lat()
          const lng = place.location.lng()
          ctx.formData.latitude = lat
          ctx.formData.longitude = lng

          if (!ctx.formData.location_name && place.displayName) {
            ctx.formData.location_name = place.displayName
          }

          map?.setCenter({ lat, lng })
          map?.setZoom(14)

          if (marker) {
            marker.position = { lat, lng }
          } else if (map) {
            marker = createMarker(map, { lat, lng })
            marker.addEventListener('gmp-dragend', handleMarkerDrag)
          }
        }
      })
    }
  } catch {
    // Google Maps unavailable
  }
})

onBeforeUnmount(() => {
  if (marker) {
    marker.map = null
  }
  if (map) {
    google.maps.event.clearInstanceListeners(map)
  }
})

function handleMapClick(e: google.maps.MapMouseEvent) {
  if (!e.latLng || !map) return

  const lat = e.latLng.lat()
  const lng = e.latLng.lng()

  ctx.formData.latitude = lat
  ctx.formData.longitude = lng

  if (marker) {
    marker.position = { lat, lng }
  } else {
    marker = createMarker(map, { lat, lng })
    marker.addEventListener('gmp-dragend', handleMarkerDrag)
  }
}

function handleMarkerDrag() {
  if (!marker?.position) return
  const { lat, lng } = resolveLatLng(marker.position)
  ctx.formData.latitude = lat
  ctx.formData.longitude = lng
}

function handleRegionChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  ctx.formData.region_id = val ? Number(val) : null
}
</script>

<template>
  <div class="step-content">
    <h2 class="step-title">Location & Region</h2>
    <p class="step-subtitle">Set the trail location on the map and select its region.</p>

    <div class="form-group">
      <label class="field-label">Search Location</label>
      <div ref="searchContainer" class="autocomplete-container" />
    </div>

    <div class="form-group">
      <label class="field-label">Map <span class="required">*</span></label>
      <div v-if="loadError" class="map-error">
        {{ loadError }}
      </div>
      <div ref="mapContainer" class="main-map" />
      <div v-if="ctx.formData.latitude != null && ctx.formData.longitude != null" class="coords-row">
        <span class="coord-label">Lat:</span>
        <span class="coord-value">{{ Number(ctx.formData.latitude).toFixed(6) }}</span>
        <span class="coord-label">Lng:</span>
        <span class="coord-value">{{ Number(ctx.formData.longitude).toFixed(6) }}</span>
      </div>
      <span v-if="errors.latitude || errors.longitude" class="error-msg">
        {{ errors.latitude || errors.longitude }}
      </span>
    </div>

    <div class="two-col">
      <div class="form-group">
        <label class="field-label" for="location-name">Location Name <span class="required">*</span></label>
        <input
          id="location-name"
          v-model="ctx.formData.location_name"
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.location_name }"
          placeholder="e.g. Naro Moru, Central Kenya"
        />
        <span v-if="errors.location_name" class="error-msg">{{ errors.location_name }}</span>
      </div>

      <div class="form-group">
        <label class="field-label" for="region">Region <span class="required">*</span></label>
        <select
          id="region"
          class="form-select"
          :class="{ 'input-error': errors.region_id }"
          :value="ctx.formData.region_id ?? ''"
          @change="handleRegionChange"
        >
          <option value="">Select region...</option>
          <option
            v-for="region in trailsStore.regions"
            :key="region.id"
            :value="region.id"
          >
            {{ region.name }}<template v-if="region.trail_count != null"> ({{ region.trail_count }} trails)</template>
          </option>
        </select>
        <span v-if="errors.region_id" class="error-msg">{{ errors.region_id }}</span>
      </div>
    </div>

    <GpxFileManager
      :model-value="ctx.formData.gpx_file_ids"
      @update:model-value="ctx.formData.gpx_file_ids = $event"
    />
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 720px;
}

.step-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.step-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: -12px 0 0 0;
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

.required {
  color: var(--color-error);
}

.form-input,
.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-background);
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.input-error {
  border-color: var(--color-error) !important;
}

.error-msg {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.autocomplete-container {
  width: 100%;
}

.autocomplete-container :deep(gmp-place-autocomplete) {
  width: 100%;
}

.main-map {
  width: 100%;
  height: 400px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background-alt);
}

.map-error {
  padding: var(--space-3);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.coords-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
}

.coord-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.coord-value {
  font-family: monospace;
  color: var(--color-text-primary);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 640px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
