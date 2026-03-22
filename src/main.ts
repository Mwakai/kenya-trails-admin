import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vClickOutside } from './directives/clickOutside'
import './assets/design-tokens.css'
import * as Sentry from '@sentry/vue'

const app = createApp(App)

if (!import.meta.env.DEV) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    release: 'kenya-trails-admin',
    integrations: [Sentry.browserTracingIntegration({ router })],
    sampleRate: 1.0,
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /laravel-api/, /^\//],
    environment: import.meta.env.MODE,
    beforeSend(event, hint) {
      console.error('[Sentry]', hint.originalException)
      return event
    },
  })
}

app.directive('click-outside', vClickOutside)

app.use(createPinia())
app.use(router)

app.mount('#app')
