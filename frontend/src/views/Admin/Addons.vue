<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">Add-ons</h2>
      <button @click="openAddModal" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl shadow-md" title="Add Add-on">
        <font-awesome-icon :icon="['fas', 'plus']" />
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search add-ons by name..." 
        class="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full relative">
        <thead class="bg-gray-50">
          <tr>
            <th @click="sortTable('name')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Name
              <span v-if="sortColumn === 'name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortTable('status')" class="px-6 py-3 text-left text-sm font-bold cursor-pointer hover:bg-gray-100">
              Status
              <span v-if="sortColumn === 'status'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="px-6 py-3 text-center text-sm font-bold sticky right-0 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] min-w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="3" class="px-6 py-8 text-center text-gray-500">
              <div class="flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 mr-3 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading add-ons...
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredAddons.length === 0">
            <td colspan="3" class="px-6 py-4 text-center text-gray-500">No add-ons found</td>
          </tr>
          <tr v-else v-for="addon in paginatedAddons" :key="addon._id" class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">{{ addon.name }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusClass(addon.status)" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ addon.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)] whitespace-nowrap min-w-[100px]">
              <button @click="openEditModal(addon)" class="text-blue-500 hover:text-blue-700 mr-2" title="Edit">
                <font-awesome-icon :icon="['fas', 'edit']" class="text-lg" />
              </button>
              <button @click="deleteAddon(addon._id)" class="text-red-500 hover:text-red-700" title="Delete">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-lg" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Items per page:</label>
          <select v-model.number="itemsPerPage" @change="currentPage = 1" class="border border-gray-300 rounded px-2 py-1 text-sm">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-sm text-gray-600 ml-4">
            Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredAddons.length) }} 
            to {{ Math.min(currentPage * itemsPerPage, filteredAddons.length) }} 
            of {{ filteredAddons.length }} add-ons
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="currentPage = 1" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            First
          </button>
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Previous
          </button>
          <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next
          </button>
          <button 
            @click="currentPage = totalPages" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Last
          </button>
        </div>
      </div>
    </div>

    <Modal :is-open="isModalOpen" :title="editingAddon ? 'Edit Add-on' : 'Add Add-on'" @close="closeModal">
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Name</label>
          <input v-model="form.name" type="text" required class="w-full p-3 rounded-xl border border-gray-300" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-bold mb-2">Status</label>
          <select v-model="form.status" required class="w-full p-3 rounded-xl border border-gray-300">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="flex gap-4">
          <button type="button" @click="closeModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl">Cancel</button>
          <button type="submit" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-2xl">Save</button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal :is-open="isDeleteModalOpen" title="Confirm Delete" size="sm" @close="closeDeleteModal">
      <div class="text-center py-2">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
          <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="text-red-600 text-2xl" />
        </div>
        <p class="text-sm font-semibold text-gray-900 mb-2">Are you sure you want to delete this add-on?</p>
        <p class="text-xs text-gray-600 mb-4">This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="closeDeleteModal" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl text-sm">Delete</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import Modal from '../../components/Modal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash, faPlus, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

library.add(faEdit, faTrash, faPlus, faExclamationCircle)
const toast = inject('toast')

const addons = ref([])
const searchQuery = ref('')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const addonToDelete = ref(null)
const editingAddon = ref(null)
const isLoading = ref(false)
const currentUserRole = ref('')
const currentUserStore = ref(null)
const sortColumn = ref('')
const sortDirection = ref('asc')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const form = ref({
  name: '',
  status: 'active'
})

const sortedAddons = computed(() => {
  if (!sortColumn.value) return addons.value
  
  return [...addons.value].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
})

const filteredAddons = computed(() => {
  let filtered = sortedAddons.value
  
  // Apply role-based filtering
  if (currentUserRole.value === 'Admin') {
    filtered = sortedAddons.value
  } else if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
    filtered = sortedAddons.value.filter(addon => {
      // Show global add-ons (created by Admin)
      if (addon.isGlobal) return true
      // Show add-ons assigned to this Co-Admin's store
      if (addon.stores && Array.isArray(addon.stores)) {
        return addon.stores.some(store => {
          const storeId = typeof store === 'object' ? store._id : store
          return storeId === currentUserStore.value
        })
      }
      return false
    })
  } else {
    filtered = sortedAddons.value
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(addon => 
      addon.name?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredAddons.value.length / itemsPerPage.value)
})

const paginatedAddons = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAddons.value.slice(start, end)
})

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const sortTable = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const fetchAddons = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/addons')
    if (response.data.success) {
      addons.value = response.data.addons
    }
  } catch (error) {
    console.error('Error fetching add-ons:', error)
    if (toast) {
      toast('Failed to load add-ons', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const openAddModal = () => {
  editingAddon.value = null
  form.value = { name: '', status: 'active' }
  isModalOpen.value = true
}

const openEditModal = (addon) => {
  editingAddon.value = addon
  form.value = {
    name: addon.name,
    status: addon.status
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingAddon.value = null
}

const submitForm = async () => {
  try {
    isLoading.value = true

    if (editingAddon.value) {
      // Update add-on
      const response = await api.put(`/addons/${editingAddon.value._id}`, form.value)
      if (response.data.success) {
        const index = addons.value.findIndex(a => a._id === editingAddon.value._id)
        if (index !== -1) {
          addons.value[index] = response.data.addon
        }
        if (toast) {
          toast('Add-on updated successfully', 'success')
        }
      }
    } else {
      // Create add-on
      const addonData = { ...form.value }
      
      // Add store assignment based on role
      if (currentUserRole.value === 'Co-Admin' && currentUserStore.value) {
        addonData.stores = [currentUserStore.value]
        addonData.isGlobal = false
      } else if (currentUserRole.value === 'Admin') {
        // Admin creates global add-ons by default (no store assignment)
        addonData.stores = []
        addonData.isGlobal = true
      }
      
      const response = await api.post('/addons', addonData)
      if (response.data.success) {
        addons.value.push(response.data.addon)
        if (toast) {
          toast('Add-on created successfully', 'success')
        }
      }
    }

    closeModal()
  } catch (error) {
    console.error('Error saving add-on:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to save add-on', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const deleteAddon = (id) => {
  addonToDelete.value = id
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  addonToDelete.value = null
}

const confirmDelete = async () => {
  if (!addonToDelete.value) return

  try {
    isLoading.value = true
    const response = await api.delete(`/addons/${addonToDelete.value}`)

    if (response.data.success) {
      const index = addons.value.findIndex(a => a._id === addonToDelete.value)
      if (index !== -1) {
        addons.value.splice(index, 1)
      }
      if (toast) {
        toast('Add-on deleted successfully', 'success')
      }
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting add-on:', error)
    if (toast) {
      toast(error.response?.data?.message || 'Failed to delete add-on', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Get current user info from auth
  const currentUser = auth.getUser() || {}
  currentUserRole.value = currentUser.role || 'Admin'
  currentUserStore.value = currentUser.store?._id || null
  
  fetchAddons()
})
</script>
