import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css' 
import FontAwesomeIcon from './fontawesome'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.use(createPinia())
app.use(router)

// Global error handler to prevent white screen crashes in production
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance?.$options?.name || 'Unknown')
  console.error('Info:', info)
  
  // In production Electron, log to console but don't crash the app
  // The component's own error handling should display user-friendly messages
}

// Handle unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    // Prevent the default handling (which might cause issues in Electron)
    event.preventDefault()
  })
}

app.mount('#app')