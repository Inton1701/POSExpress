<template>
  <nav class="bg-white shadow p-4 rounded-b-2xl">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">{{ displayTitle }}</h1>
        <p v-if="userRole === 'Co-Admin' && userStore" class="text-sm text-gray-500">{{ userStore.address }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <font-awesome-icon :icon="['fas', 'user-circle']" class="text-gray-600 text-xl" />
          <span class="text-sm text-gray-600">{{ userName }} <span class="text-xs text-gray-400">({{ roleLabel }})</span></span>
        </div>
        
        <!-- Keyboard Button -->
        <button 
          @click="toggleKeyboardModal" 
          class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95"
          title="On-Screen Keyboard"
        >
          <font-awesome-icon :icon="['fas', 'keyboard']" class="text-gray-600 text-xl" />
        </button>

        <!-- Fullscreen Button -->
        <button 
          @click="toggleFullScreen" 
          class="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition active:scale-95"
          title="Toggle Fullscreen"
        >
          <font-awesome-icon :icon="['fas', 'expand']" class="text-gray-600 text-xl" />
        </button>
        
        <!-- Hamburger Menu -->
        <div class="relative">
          <button 
            @click="toggleMenu" 
            class="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition"
          >
            <font-awesome-icon :icon="['fas', 'ellipsis-v']" class="text-gray-600" />
          </button>
          
          <!-- Dropdown Menu -->
          <div v-if="isMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            <router-link 
              to="/admin/settings" 
              @click="isMenuOpen = false"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
            >
              <font-awesome-icon :icon="['fas', 'cog']" />
              <span>Settings</span>
            </router-link>
            <button 
              @click="showLogoutConfirm" 
              class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-red-600"
            >
              <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="isLogoutModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="text-red-600 text-xl" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
          <p class="text-sm text-gray-600 mb-6">Are you sure you want to logout?</p>
          <div class="flex gap-3">
            <button @click="closeLogoutConfirm" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm">
              Cancel
            </button>
            <button @click="confirmLogout" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- On-Screen Keyboard Modal -->
    <div v-if="isKeyboardModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-900">On-Screen Keyboard</h3>
          <button @click="toggleKeyboardModal" class="text-gray-500 hover:text-gray-700">
            <font-awesome-icon :icon="['fas', 'times']" class="text-xl" />
          </button>
        </div>
        
        <!-- Preview -->
        <div class="mb-4 p-4 bg-gray-100 rounded-xl text-center text-2xl font-mono min-h-[60px] flex items-center justify-center">
          <span v-if="keyboardValue" class="break-all">{{ keyboardValue }}</span>
          <span v-else class="text-gray-400">Type here...</span>
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
            <font-awesome-icon :icon="['fas', 'backspace']" />
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
        
        <!-- Close button -->
        <div class="flex justify-center">
          <button @click="toggleKeyboardModal" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-xl">Done</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserCircle, faEllipsisV, faCog, faSignOutAlt, faKeyboard, faExpand, faBackspace, faTimes } from '@fortawesome/free-solid-svg-icons'
import { auth } from '@/utils/auth'

library.add(faUserCircle, faEllipsisV, faCog, faSignOutAlt, faKeyboard, faExpand, faBackspace, faTimes)

const props = defineProps({
  title: {
    type: String,
    default: 'RFID POS System'
  }
})

const router = useRouter()
const userName = ref('')
const userRole = ref('')
const userStore = ref(null)
const isMenuOpen = ref(false)
const isLogoutModalOpen = ref(false)
const isKeyboardModalOpen = ref(false)
const keyboardValue = ref('')

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const showLogoutConfirm = () => {
  isMenuOpen.value = false
  isLogoutModalOpen.value = true
}

const closeLogoutConfirm = () => {
  isLogoutModalOpen.value = false
}

const confirmLogout = () => {
  auth.logout()
  isLogoutModalOpen.value = false
  router.push('/')
}

const toggleKeyboardModal = () => {
  isKeyboardModalOpen.value = !isKeyboardModalOpen.value
  if (!isKeyboardModalOpen.value) {
    keyboardValue.value = ''
  }
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

const roleLabel = computed(() => {
  const labels = {
    'Admin': 'Admin',
    'Co-Admin': 'Co-Admin',
    'Cashier': 'Cashier',
    'Student': 'Student'
  }
  return labels[userRole.value] || userRole.value
})

const displayTitle = computed(() => {
  // Show store name in all capitals
  if (userStore.value && userStore.value.storeName) {
    return userStore.value.storeName.toUpperCase()
  }
  return props.title
})

onMounted(() => {
  const user = auth.getUser()
  userName.value = user?.username || 'User'
  userRole.value = user?.role || ''
  userStore.value = user?.store || null
})
</script>
