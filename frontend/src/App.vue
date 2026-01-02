<script setup>
import { RouterView } from 'vue-router'
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { api } from '@/utils/api'
import Toast from './components/Toast.vue'

const toastRef = ref(null)
const serverStatus = ref('checking')
let statusCheckInterval = null

const showToast = (message, type = 'info', title = '', duration = 3000) => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type, title, duration)
  }
}

const checkServerConnection = async () => {
  try {
    const response = await api.get('/health', { timeout: 3000 })
    const wasOffline = serverStatus.value === 'offline'
    serverStatus.value = 'connected'
    
    // Show reconnection toast if server was previously offline
    if (wasOffline) {
      showToast('Server connection restored', 'success', 'Connected', 2000)
    }
  } catch (error) {
    const wasConnected = serverStatus.value === 'connected'
    serverStatus.value = 'offline'
    
    // Show offline toast only once when connection is first lost
    if (wasConnected) {
      showToast('Lost connection to server', 'error', 'Offline', 3000)
    }
  }
}

provide('toast', showToast)
provide('serverStatus', serverStatus)

onMounted(() => {
  // Check server connection immediately
  checkServerConnection()
  
  // Check every 10 seconds
  statusCheckInterval = setInterval(checkServerConnection, 10000)
})

onUnmounted(() => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
  }
})
</script>

<template>
  <RouterView />
  <Toast ref="toastRef" />
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
