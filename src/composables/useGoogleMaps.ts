import { ref } from 'vue'

const isLoaded = ref(false)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

function loadScript(): Promise<void> {
  if (isLoaded.value) return Promise.resolve()
  if (isLoading.value) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (isLoaded.value) {
          clearInterval(check)
          resolve()
        }
        if (loadError.value) {
          clearInterval(check)
          reject(new Error(loadError.value))
        }
      }, 100)
    })
  }

  isLoading.value = true
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    const msg = 'VITE_GOOGLE_MAPS_API_KEY is not set'
    loadError.value = msg
    isLoading.value = false
    return Promise.reject(new Error(msg))
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      isLoaded.value = true
      isLoading.value = false
      resolve()
    }

    script.onerror = () => {
      const msg = 'Failed to load Google Maps script'
      loadError.value = msg
      isLoading.value = false
      reject(new Error(msg))
    }

    document.head.appendChild(script)
  })
}

export function useGoogleMaps() {
  async function initMap(
    element: HTMLElement,
    options?: google.maps.MapOptions,
  ): Promise<google.maps.Map> {
    await loadScript()
    return new google.maps.Map(element, {
      zoom: 7,
      center: { lat: 0.0236, lng: 37.9062 }, // Kenya center
      mapTypeControl: true,
      streetViewControl: true,
      ...options,
    })
  }

  function createMarker(
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    draggable = true,
  ): google.maps.Marker {
    return new google.maps.Marker({
      map,
      position,
      draggable,
    })
  }

  async function createAutocomplete(
    input: HTMLInputElement,
    options?: google.maps.places.AutocompleteOptions,
  ): Promise<google.maps.places.Autocomplete> {
    await loadScript()
    return new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'ke' },
      fields: ['geometry', 'name', 'formatted_address'],
      ...options,
    })
  }

  return {
    isLoaded,
    loadError,
    initMap,
    createMarker,
    createAutocomplete,
  }
}
