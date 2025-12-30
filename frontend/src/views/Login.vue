<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center p-4 relative">
    <!-- Server Status Indicator -->
    <div class="fixed top-4 left-4 z-50">
      <div 
        class="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg font-semibold transition-all"
        :class="serverStatus === 'connected' ? 'bg-green-100 text-green-800 border border-green-300' : 
                serverStatus === 'offline' ? 'bg-red-100 text-red-800 border border-red-300' : 
                'bg-yellow-100 text-yellow-800 border border-yellow-300'"
      >
        <div 
          class="w-3 h-3 rounded-full animate-pulse"
          :class="serverStatus === 'connected' ? 'bg-green-600' : 
                  serverStatus === 'offline' ? 'bg-red-600' : 
                  'bg-yellow-600'"
        ></div>
        <span class="text-sm">
          {{ serverStatus === 'connected' ? 'Connected' : 
             serverStatus === 'offline' ? 'Offline' : 
             'Checking...' }}
        </span>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md">
      <div class="flex justify-center mb-6">
        <img src="/logo.png" alt="PosXpress" class="h-16 w-auto" />
      </div>

      
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Username</label>
          <input v-model="form.username" type="text" :required="!form.rfid" class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500" :disabled="!!form.rfid" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Password</label>
          <div class="relative">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              :required="!form.rfid" 
              class="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500" 
              :disabled="!!form.rfid" 
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              :disabled="!!form.rfid"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="text-center text-gray-500 text-sm my-4">- OR -</div>
        
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">RFID</label>
          <input v-model="form.rfid" type="text" :required="!form.username && !form.password" placeholder="Scan or enter RFID" class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500" :disabled="!!form.username || !!form.password" />
        </div>
        
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
          {{ errorMessage }}
        </div>
        
        <button type="submit" :disabled="isLoading" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="isLoading">Logging in...</span>
          <span v-else>Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const serverStatus = inject('serverStatus')

const form = ref({
  username: '',
  password: '',
  rfid: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Send either username+password OR rfid
    const loginData = form.value.rfid 
      ? { rfid: form.value.rfid }
      : { username: form.value.username, password: form.value.password }
    
    const response = await axios.post(`${API_URL}/users/login`, loginData)

    if (response.data.success) {
      const user = response.data.user
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user))
      
      // Redirect based on role using replace to avoid back button issues
      let redirectPath = '/customer' // default
      
      if (user.role === 'Admin' || user.role === 'Co-Admin') {
        redirectPath = '/admin/dashboard'
      } else if (user.role === 'Cashier') {
        redirectPath = '/pos'
      } else if (user.role === 'Accounting') {
        redirectPath = '/accounting'
      }
      
      // Use replace instead of push for cleaner navigation
      await router.replace(redirectPath)
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.response?.data?.message || 'Invalid username or password. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
