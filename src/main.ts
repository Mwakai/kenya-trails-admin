import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vClickOutside } from './directives/clickOutside'
import './assets/design-tokens.css'

const app = createApp(App)

app.directive('click-outside', vClickOutside)

app.use(createPinia())
app.use(router)

app.mount('#app')
