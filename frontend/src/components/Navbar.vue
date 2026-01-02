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
  </nav>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserCircle, faEllipsisV, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { auth } from '@/utils/auth'

library.add(faUserCircle, faEllipsisV, faCog, faSignOutAlt)

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
