<template>
  <Transition name="toast-container">
    <div v-if="toasts.length > 0" class="fixed top-4 right-4 z-[9999] space-y-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'min-w-[300px] max-w-[400px] rounded-lg shadow-lg p-4 flex items-start gap-3',
            'backdrop-blur-sm border',
            getToastClass(toast.type)
          ]"
        >
          <div class="flex-shrink-0">
            <font-awesome-icon 
              :icon="['fas', getIcon(toast.type)]" 
              :class="getIconClass(toast.type)"
              class="text-xl"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="toast.title" class="font-bold text-sm mb-1">{{ toast.title }}</p>
            <p class="text-sm">{{ toast.message }}</p>
          </div>
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <font-awesome-icon :icon="['fas', 'times']" class="text-sm" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheckCircle, faExclamationCircle, faInfoCircle, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faCheckCircle, faExclamationCircle, faInfoCircle, faExclamationTriangle, faTimes)

const toasts = ref([])
let nextId = 0

const getToastClass = (type) => {
  const classes = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  }
  return classes[type] || classes.info
}

const getIcon = (type) => {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  }
  return icons[type] || icons.info
}

const getIconClass = (type) => {
  const classes = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }
  return classes[type] || classes.info
}

const addToast = (message, type = 'info', title = '', duration = 3000) => {
  const id = nextId++
  toasts.value.push({ id, message, type, title })
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ addToast })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
