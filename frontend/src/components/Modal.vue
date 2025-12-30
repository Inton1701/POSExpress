<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-2xl p-6 w-full max-h-[90vh] overflow-y-auto" :class="maxWidthClass">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">{{ title }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  title: String,
  size: {
    type: String,
    default: 'default'
  }
})

const maxWidthClass = computed(() => {
  const sizes = {
    'sm': 'max-w-md',
    'default': 'max-w-2xl',
    'lg': 'max-w-4xl',
    'xl': 'max-w-6xl',
    'full': 'max-w-[95vw]'
  }
  return sizes[props.size] || sizes.default
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>
