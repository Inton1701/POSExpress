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

    <!-- Top Right Buttons: Keyboard and Fullscreen -->
    <div class="fixed top-4 right-4 z-50 flex gap-2">
      <button 
        @click="toggleKeyboardModal" 
        class="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-lg shadow-lg transition"
        title="On-Screen Keyboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V5zm1 1v6h12V6H4zm2 2a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm4 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm4 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM5 11a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
      <button 
        @click="toggleFullScreen" 
        class="bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-lg shadow-lg transition"
        title="Toggle Fullscreen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm12 0a1 1 0 011 1v3a1 1 0 11-2 0V5h-3a1 1 0 110-2h4zm-12 12a1 1 0 011-1h3a1 1 0 110 2H4a1 1 0 01-1-1v-4a1 1 0 112 0v3zm12 0a1 1 0 01-1 1h-3a1 1 0 110-2h3v-3a1 1 0 112 0v4z" clip-rule="evenodd" />
        </svg>
      </button>
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

    <!-- On-Screen Keyboard Modal -->
    <div v-if="isKeyboardModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-900">On-Screen Keyboard</h3>
          <button @click="toggleKeyboardModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <!-- Preview -->
        <div class="mb-4 p-4 bg-gray-100 rounded-xl text-center text-2xl font-mono min-h-[60px] flex items-center justify-center">
          <span v-if="keyboardValue" class="break-all">{{ keyboardTarget === 'password' ? '•'.repeat(keyboardValue.length) : keyboardValue }}</span>
          <span v-else class="text-gray-400">Type here...</span>
        </div>

        <!-- Target selector -->
        <div class="flex gap-2 mb-4">
          <button @click="keyboardTarget = 'username'" 
            :class="keyboardTarget === 'username' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-2 rounded-lg font-semibold transition">Username</button>
          <button @click="keyboardTarget = 'password'" 
            :class="keyboardTarget === 'password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-2 rounded-lg font-semibold transition">Password</button>
          <button @click="keyboardTarget = 'rfid'" 
            :class="keyboardTarget === 'rfid' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-2 rounded-lg font-semibold transition">RFID</button>
        </div>
        
        <!-- Number Row -->
        <div class="grid grid-cols-10 gap-2 mb-2">
          <button v-for="num in ['1','2','3','4','5','6','7','8','9','0']" :key="num" 
            @click="keyboardValue += num" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">
            {{ num }}
          </button>
        </div>
        
        <!-- QWERTY Row -->
        <div class="grid grid-cols-10 gap-2 mb-2">
          <button v-for="key in ['Q','W','E','R','T','Y','U','I','O','P']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">
            {{ key }}
          </button>
        </div>
        
        <!-- ASDF Row -->
        <div class="grid grid-cols-10 gap-2 mb-2 px-3">
          <button v-for="key in ['A','S','D','F','G','H','J','K','L']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">
            {{ key }}
          </button>
          <button @click="keyboardValue = keyboardValue.slice(0, -1)" class="bg-red-400 hover:bg-red-500 text-white font-bold py-3 text-sm rounded-lg">
            ⌫
          </button>
        </div>
        
        <!-- ZXCV Row -->
        <div class="grid grid-cols-10 gap-2 mb-2 px-6">
          <button v-for="key in ['Z','X','C','V','B','N','M','-']" :key="key" 
            @click="keyboardValue += key" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">
            {{ key }}
          </button>
          <button @click="keyboardValue = ''" class="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 text-sm rounded-lg col-span-2">
            Clear
          </button>
        </div>
        
        <!-- Space bar -->
        <div class="grid grid-cols-10 gap-2 mb-4 px-10">
          <button @click="keyboardValue += '@'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">@</button>
          <button @click="keyboardValue += '.'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">.</button>
          <button @click="keyboardValue += ' '" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 text-lg rounded-lg col-span-6">Space</button>
          <button @click="keyboardValue += '_'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">_</button>
          <button @click="keyboardValue += '#'" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 text-lg rounded-lg">#</button>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-4">
          <button @click="toggleKeyboardModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 text-lg rounded-xl">Cancel</button>
          <button @click="applyKeyboardValue" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 text-lg rounded-xl">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

const router = useRouter()
const serverStatus = inject('serverStatus')

const form = ref({
  username: '',
  password: '',
  rfid: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const isKeyboardModalOpen = ref(false)
const keyboardValue = ref('')
const keyboardTarget = ref('username')

const toggleKeyboardModal = () => {
  isKeyboardModalOpen.value = !isKeyboardModalOpen.value
  if (isKeyboardModalOpen.value) {
    // Load current value based on target
    if (keyboardTarget.value === 'username') {
      keyboardValue.value = form.value.username
    } else if (keyboardTarget.value === 'password') {
      keyboardValue.value = form.value.password
    } else if (keyboardTarget.value === 'rfid') {
      keyboardValue.value = form.value.rfid
    }
  } else {
    keyboardValue.value = ''
  }
}

const applyKeyboardValue = () => {
  if (keyboardTarget.value === 'username') {
    form.value.username = keyboardValue.value
    form.value.rfid = '' // Clear RFID when entering username
  } else if (keyboardTarget.value === 'password') {
    form.value.password = keyboardValue.value
    form.value.rfid = '' // Clear RFID when entering password
  } else if (keyboardTarget.value === 'rfid') {
    form.value.rfid = keyboardValue.value
    form.value.username = '' // Clear username when entering RFID
    form.value.password = '' // Clear password when entering RFID
  }
  toggleKeyboardModal()
}

const toggleFullScreen = async () => {
  try {
    if (window.electronAPI?.toggleFullscreen) {
      await window.electronAPI.toggleFullscreen()
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    }
  } catch (err) {
    console.error('Failed to toggle fullscreen:', err)
  }
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Send either username+password OR rfid
    const loginData = form.value.rfid 
      ? { rfid: form.value.rfid }
      : { username: form.value.username, password: form.value.password }
    
    const response = await api.post('/users/login', loginData)

    if (response.data.success) {
      const user = response.data.user
      const token = response.data.token
      
      // Store token and user data
      auth.login(token, user)
      
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
