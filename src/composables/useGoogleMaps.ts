import { ref } from 'vue'

const isLoaded = ref(false)
const loadError = ref<string | null>(null)
let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (loadPromise) return loadPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    const msg = 'VITE_GOOGLE_MAPS_API_KEY is not set'
    loadError.value = msg
    return Promise.reject(new Error(msg))
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`
    script.async = true
    script.defer = true

    script.onload = () => {
      isLoaded.value = true
      resolve()
    }

    script.onerror = () => {
      const msg = 'Failed to load Google Maps script'
      loadError.value = msg
      loadPromise = null
      reject(new Error(msg))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

function resolveLatLng(pos: google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLngLiteral {
  if (pos instanceof google.maps.LatLng) {
    return { lat: pos.lat(), lng: pos.lng() }
  }
  return pos
}

export function useGoogleMaps() {
  async function initMap(
    element: HTMLElement,
    options?: google.maps.MapOptions,
  ): Promise<google.maps.Map> {
    await loadScript()
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
    return new google.maps.Map(element, {
      zoom: 7,
      center: { lat: 0.0236, lng: 37.9062 }, // Kenya center
      mapTypeControl: true,
      streetViewControl: true,
      ...options,
      mapId,
    })
  }

  function createMarker(
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    draggable = true,
  ): google.maps.marker.AdvancedMarkerElement {
    return new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      gmpDraggable: draggable,
    })
  }

  async function createAutocomplete(
    container: HTMLElement,
  ): Promise<google.maps.places.PlaceAutocompleteElement> {
    await loadScript()
    const autocomplete = new google.maps.places.PlaceAutocompleteElement({
      componentRestrictions: { country: 'ke' },
    })
    container.appendChild(autocomplete as unknown as Node)
    return autocomplete
  }

  return {
    isLoaded,
    loadError,
    initMap,
    createMarker,
    createAutocomplete,
    resolveLatLng,
  }
}
