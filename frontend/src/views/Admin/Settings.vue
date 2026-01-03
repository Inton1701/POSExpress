<template>
  <div>
    <h2 class="text-3xl font-bold mb-6">Settings</h2>

    <!-- Settings Tabs -->
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <div class="flex gap-4 border-b pb-3 mb-6">
        <button 
          @click="activeTab = 'profile'"
          :class="activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="user" class="mr-2" />
          Admin Profile
        </button>
        <button 
          @click="activeTab = 'vat'"
          :class="activeTab === 'vat' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="percent" class="mr-2" />
          VAT Rate
        </button>
        <button 
          @click="activeTab = 'updates'"
          :class="activeTab === 'updates' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
          class="px-6 py-2 rounded-lg font-bold transition"
        >
          <font-awesome-icon icon="sync-alt" class="mr-2" />
          System Updates
        </button>
        <button 
          @click="showLogoutConfirm"
          class="ml-auto bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition hover:bg-red-600"
        >
          <font-awesome-icon icon="sign-out-alt" class="mr-2" />
          Logout
        </button>
      </div>

      <!-- Admin Profile Tab -->
      <div v-if="activeTab === 'profile'">
        <h3 class="text-xl font-bold mb-4">Update Profile Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-bold mb-2">Username</label>
            <input 
              v-model="profileForm.username" 
              type="text" 
              class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">RFID</label>
            <input 
              v-model="profileForm.rfid" 
              type="text" 
              class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
              placeholder="Enter RFID number (optional)"
            />
          </div>
        </div>

        <div class="border-t pt-6 mb-6">
          <h4 class="text-lg font-bold mb-4">Store Information</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label class="block text-sm font-bold mb-2">Store Name</label>
              <input 
                v-model="profileForm.storeName" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter store name"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Contact Number</label>
              <input 
                v-model="profileForm.contact" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter contact number"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold mb-2">Address</label>
              <textarea 
                v-model="profileForm.address" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                rows="2"
                placeholder="Enter store address"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">TIN #</label>
              <input 
                v-model="profileForm.tin" 
                type="text" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Tax Identification Number"
              />
            </div>
          </div>
        </div>

        <div class="border-t pt-6 mb-6">
          <h4 class="text-lg font-bold mb-4">Change Password</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-bold mb-2">Current Password</label>
              <input 
                v-model="profileForm.currentPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">New Password</label>
              <input 
                v-model="profileForm.newPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Confirm New Password</label>
              <input 
                v-model="profileForm.confirmPassword" 
                type="password" 
                class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button 
            @click="updateProfile" 
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow transition disabled:opacity-50"
          >
            <font-awesome-icon v-if="isLoading" icon="spinner" spin class="mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <!-- VAT Rate Tab -->
      <div v-if="activeTab === 'vat'">
        <h3 class="text-xl font-bold mb-4">Global VAT Configuration</h3>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <font-awesome-icon icon="info-circle" class="mr-2" />
            This VAT will be applied to all products marked as "Vattable". Choose between Fixed amount or Percentage.
          </p>
        </div>

        <div class="max-w-2xl space-y-6">
          <!-- VAT Type Selection -->
          <div>
            <label class="block text-sm font-bold mb-2">VAT Type</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  v-model="vatForm.type" 
                  value="percent" 
                  class="w-4 h-4 text-blue-600"
                />
                <span>Percentage (%)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  v-model="vatForm.type" 
                  value="fixed" 
                  class="w-4 h-4 text-blue-600"
                />
                <span>Fixed Amount (₱)</span>
              </label>
            </div>
          </div>

          <!-- VAT Value Input -->
          <div>
            <label class="block text-sm font-bold mb-2">
              {{ vatForm.type === 'percent' ? 'VAT Percentage (%)' : 'Fixed VAT Amount (₱)' }}
            </label>
            <div class="flex gap-3">
              <input 
                v-model.number="vatForm.value" 
                type="number" 
                step="0.01"
                min="0"
                :max="vatForm.type === 'percent' ? '100' : '999999'"
                class="flex-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                :placeholder="vatForm.type === 'percent' ? 'e.g., 12.00' : 'e.g., 10.00'"
              />
              <button 
                @click="updateVATRate" 
                :disabled="isLoading"
                class="bg-green-600 hover:bg-green-700 text-white font-bold px-8 rounded-lg shadow transition disabled:opacity-50"
              >
                <font-awesome-icon v-if="isLoading" icon="spinner" spin class="mr-2" />
                Update
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ vatForm.type === 'percent' 
                ? 'Example: 12% VAT on ₱100 = ₱112 total' 
                : 'Example: ₱10 fixed VAT on any price = +₱10' 
              }}
            </p>
          </div>

          <!-- Current VAT Display -->
          <div v-if="currentVatConfig" class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">Current VAT Configuration</p>
            <div class="flex items-baseline gap-3">
              <p class="text-3xl font-bold text-gray-800">
                {{ currentVatConfig.type === 'percent' 
                  ? `${currentVatConfig.value}%` 
                  : `₱${currentVatConfig.value.toFixed(2)}` 
                }}
              </p>
              <span class="text-sm text-gray-600">
                ({{ currentVatConfig.type === 'percent' ? 'Percentage' : 'Fixed Amount' }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Updates Tab -->
      <div v-if="activeTab === 'updates'">
        <h3 class="text-xl font-bold mb-4">System Update</h3>
        
        <div class="max-w-2xl space-y-6">
          <!-- Current Version -->
          <div class="bg-gray-50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Current Version</p>
                <p class="text-3xl font-bold text-gray-800">v{{ currentVersion }}</p>
              </div>
              <div class="text-5xl">
                <font-awesome-icon icon="code-branch" class="text-blue-500" />
              </div>
            </div>
            <p class="text-xs text-gray-500">Last checked: {{ lastChecked || 'Never' }}</p>
          </div>

          <!-- Update Status -->
          <div v-if="updateStatus" class="rounded-lg p-6" :class="{
            'bg-green-50 border border-green-200': updateStatus === 'up-to-date',
            'bg-blue-50 border border-blue-200': updateStatus === 'update-available',
            'bg-red-50 border border-red-200': updateStatus === 'error'
          }">
            <div class="flex items-start gap-3">
              <font-awesome-icon 
                :icon="updateStatus === 'up-to-date' ? 'check-circle' : updateStatus === 'update-available' ? 'exclamation-circle' : 'circle-xmark'" 
                class="text-2xl mt-1"
                :class="{
                  'text-green-600': updateStatus === 'up-to-date',
                  'text-blue-600': updateStatus === 'update-available',
                  'text-red-600': updateStatus === 'error'
                }"
              />
              <div class="flex-1">
                <p class="font-bold mb-1" :class="{
                  'text-green-800': updateStatus === 'up-to-date',
                  'text-blue-800': updateStatus === 'update-available',
                  'text-red-800': updateStatus === 'error'
                }">
                  {{ updateStatus === 'up-to-date' ? 'System is up to date' : 
                     updateStatus === 'update-available' ? 'Update Available!' : 
                     'Error checking for updates' }}
                </p>
                <p class="text-sm" :class="{
                  'text-green-700': updateStatus === 'up-to-date',
                  'text-blue-700': updateStatus === 'update-available',
                  'text-red-700': updateStatus === 'error'
                }">
                  {{ updateMessage }}
                </p>
                
                <!-- Update Details -->
                <div v-if="latestRelease && updateStatus === 'update-available'" class="mt-4 pt-4 border-t border-blue-200">
                  <p class="font-bold text-blue-900 mb-2">Version {{ latestRelease.tag_name }}</p>
                  <p class="text-sm text-blue-800 mb-3">Released on {{ formatDate(latestRelease.published_at) }}</p>
                  
                  <!-- Release Notes -->
                  <div v-if="latestRelease.body" class="bg-white rounded p-3 mb-3 max-h-48 overflow-y-auto">
                    <p class="text-xs font-bold text-gray-700 mb-2">Release Notes:</p>
                    <div class="text-xs text-gray-600 whitespace-pre-wrap">{{ latestRelease.body }}</div>
                  </div>
                  
                  <div class="flex gap-2">
                    <button 
                      @click="installUpdate"
                      :disabled="isUpdating"
                      class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      <font-awesome-icon :icon="isUpdating ? 'spinner' : 'sync-alt'" :spin="isUpdating" />
                      {{ isUpdating ? 'Installing...' : 'Install Update' }}
                    </button>
                    <a 
                      :href="latestRelease.html_url" 
                      target="_blank"
                      class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      <font-awesome-icon icon="external-link-alt" class="text-xs" />
                      View on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Check for Updates Button -->
          <div class="flex gap-3">
            <button 
              @click="checkForUpdates" 
              :disabled="isCheckingUpdates"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <font-awesome-icon 
                :icon="isCheckingUpdates ? 'spinner' : 'sync-alt'" 
                :spin="isCheckingUpdates"
              />
              {{ isCheckingUpdates ? 'Checking...' : 'Check for Updates' }}
            </button>
          </div>

          <!-- GitHub Repository Link -->
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-600 mb-2">
              <font-awesome-icon icon="info-circle" class="mr-2" />
              Updates are released on GitHub
            </p>
            <a 
              :href="githubRepoUrl" 
              target="_blank"
              class="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-2"
            >
              <font-awesome-icon :icon="['fab', 'github']" />
              View Repository
              <font-awesome-icon icon="external-link-alt" class="text-xs" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="isLogoutModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <font-awesome-icon icon="sign-out-alt" class="text-red-600 text-xl" />
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

    <!-- Toast Notification -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'
import Toast from '../../components/Toast.vue'

const router = useRouter()

const activeTab = ref('profile')
const isLoading = ref(false)
const isLogoutModalOpen = ref(false)
const currentUser = ref(null)
const currentVatConfig = ref(null)
const toastRef = ref(null)

// Update check variables
const currentVersion = ref('1.0.0')
const githubRepoUrl = ref('https://github.com/Inton1701/POSExpress')
const updateStatus = ref(null)
const updateMessage = ref('')
const latestRelease = ref(null)
const isCheckingUpdates = ref(false)
const lastChecked = ref(null)
const isUpdating = ref(false)

const profileForm = ref({
  username: '',
  rfid: '',
  storeName: '',
  address: '',
  tin: '',
  contact: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const vatForm = ref({
  type: 'percent',
  value: 0
})

const showToast = (message, type = 'success') => {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

const fetchCurrentUser = async () => {
  try {
    const user = auth.getUser() || {}
    currentUser.value = user
    profileForm.value.username = user.username || ''
    profileForm.value.rfid = user.rfid || ''
    
    // Fetch full store details
    if (user.store) {
      const storeId = typeof user.store === 'object' ? user.store._id : user.store
      if (storeId) {
        const response = await api.get(`/stores/${storeId}`)
        if (response.data.success) {
          const store = response.data.store
          profileForm.value.storeName = store.storeName || ''
          profileForm.value.address = store.address || ''
          profileForm.value.tin = store.tin || ''
          profileForm.value.contact = store.contact || ''
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    showToast('Failed to load profile information', 'error')
  }
}

const fetchVATRate = async () => {
  try {
    const response = await api.get('/settings/vat-config')
    if (response.data.success) {
      currentVatConfig.value = response.data.vatConfig
      vatForm.value.type = response.data.vatConfig.type || 'percent'
      vatForm.value.value = response.data.vatConfig.value || 0
    }
  } catch (error) {
    console.error('Error fetching VAT config:', error)
  }
}

const updateProfile = async () => {
  if (!profileForm.value.username) {
    showToast('Username is required', 'error')
    return
  }

  // If changing password, validate
  if (profileForm.value.newPassword || profileForm.value.currentPassword) {
    if (!profileForm.value.currentPassword) {
      showToast('Current password is required to change password', 'error')
      return
    }
    if (!profileForm.value.newPassword) {
      showToast('New password is required', 'error')
      return
    }
    if (profileForm.value.newPassword !== profileForm.value.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }
    if (profileForm.value.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error')
      return
    }
  }

  isLoading.value = true
  try {
    const updateData = {
      username: profileForm.value.username,
      rfid: profileForm.value.rfid || null
    }

    if (profileForm.value.currentPassword && profileForm.value.newPassword) {
      updateData.currentPassword = profileForm.value.currentPassword
      updateData.newPassword = profileForm.value.newPassword
    }

    const response = await api.put(`/users/${currentUser.value._id}`, updateData)
    
    if (response.data.success) {
      // Update store information
      if (currentUser.value.store) {
        const storeId = typeof currentUser.value.store === 'object' ? currentUser.value.store._id : currentUser.value.store
        if (storeId) {
          const storeData = {
            storeName: profileForm.value.storeName,
            address: profileForm.value.address,
            tin: profileForm.value.tin,
            contact: profileForm.value.contact
          }
          
          const storeResponse = await api.put(`/stores/${storeId}`, storeData)
        }
      }
      
      // Update localStorage
      const updatedUser = { ...currentUser.value, username: profileForm.value.username, rfid: profileForm.value.rfid }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      currentUser.value = updatedUser
      
      // Clear password fields
      profileForm.value.currentPassword = ''
      profileForm.value.newPassword = ''
      profileForm.value.confirmPassword = ''
      
      showToast('Profile and store information updated successfully', 'success')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    showToast(error.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    isLoading.value = false
  }
}

const updateVATRate = async () => {
  if (vatForm.value.value < 0) {
    showToast('VAT value cannot be negative', 'error')
    return
  }
  
  if (vatForm.value.type === 'percent' && vatForm.value.value > 100) {
    showToast('VAT percentage cannot exceed 100%', 'error')
    return
  }

  isLoading.value = true
  try {
    const response = await api.post('/settings/vat-config', {
      vatType: vatForm.value.type,
      vatValue: vatForm.value.value
    })
    
    if (response.data.success) {
      currentVatConfig.value = { type: vatForm.value.type, value: vatForm.value.value }
      showToast('VAT configuration updated successfully', 'success')
    }
  } catch (error) {
    console.error('Error updating VAT config:', error)
    showToast(error.response?.data?.message || 'Failed to update VAT configuration', 'error')
  } finally {
    isLoading.value = false
  }
}

const showLogoutConfirm = () => {
  isLogoutModalOpen.value = true
}

const closeLogoutConfirm = () => {
  isLogoutModalOpen.value = false
}

const confirmLogout = () => {
  localStorage.removeItem('user')
  isLogoutModalOpen.value = false
  router.push('/')
}

const checkForUpdates = async () => {
  isCheckingUpdates.value = true
  updateStatus.value = null
  updateMessage.value = ''
  
  try {
    // Check if user is logged in
    const currentUser = auth.getUser()
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    // Call backend API to check for updates
    const response = await api.get('/system/check-updates')
    
    if (response.data.success) {
      const data = response.data
      currentVersion.value = data.currentVersion
      
      if (data.updateAvailable) {
        latestRelease.value = data.release
        updateStatus.value = 'update-available'
        updateMessage.value = `A new version (v${data.latestVersion}) is available.`
      } else {
        updateStatus.value = 'up-to-date'
        updateMessage.value = 'You are running the latest version.'
      }
    } else {
      throw new Error(response.data.message || 'Failed to check for updates')
    }
    
    // Update last checked time
    const now = new Date()
    lastChecked.value = now.toLocaleString()
    localStorage.setItem('lastUpdateCheck', now.toISOString())
    
  } catch (error) {
    console.error('Error checking for updates:', error)
    updateStatus.value = 'error'
    
    // More specific error messages
    if (error.response?.status === 403) {
      updateMessage.value = 'Access denied. Only administrators can check for updates.'
    } else if (error.response?.status === 401) {
      updateMessage.value = 'Session expired. Please login again.'
    } else {
      updateMessage.value = error.response?.data?.message || 'Could not check for updates. Please try again later.'
    }
  } finally {
    isCheckingUpdates.value = false
  }
}

const installUpdate = async () => {
  if (!confirm('This will update the system and restart services. Continue?')) {
    return
  }
  
  isUpdating.value = true
  try {
    const response = await api.post('/system/update')
    
    if (response.data.success) {
      showToast('Update started! System will restart in a few moments...', 'success')
      
      // Show countdown and reload page
      let countdown = 30
      const countdownInterval = setInterval(() => {
        countdown--
        if (countdown <= 0) {
          clearInterval(countdownInterval)
          window.location.reload()
        }
      }, 1000)
    } else {
      throw new Error(response.data.message || 'Failed to start update')
    }
  } catch (error) {
    console.error('Error installing update:', error)
    showToast(error.response?.data?.message || 'Failed to install update', 'error')
    isUpdating.value = false
  }
}

onMounted(async () => {
  fetchCurrentUser()
  fetchVATRate()
  
  // Load last update check time
  const lastCheck = localStorage.getItem('lastUpdateCheck')
  if (lastCheck) {
    lastChecked.value = new Date(lastCheck).toLocaleString()
  }
  
  // Fetch current version from backend
  try {
    const response = await api.get('/system/version')
    if (response.data.success) {
      currentVersion.value = response.data.version
    }
  } catch (error) {
    console.error('Error fetching version:', error)
  }
})

const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(() => {
  fetchCurrentUser()
  fetchVATRate()
  
  // Load last update check time
  const lastCheck = localStorage.getItem('lastUpdateCheck')
  if (lastCheck) {
    lastChecked.value = new Date(lastCheck).toLocaleString()
  }
})
</script>
